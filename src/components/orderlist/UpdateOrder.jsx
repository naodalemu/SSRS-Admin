import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaShoppingCart,
  FaExclamationTriangle,
} from "react-icons/fa";
import MessageModal from "../ui/MessageModal";
import MenuItemCard from "./MenuItemCard";

function UpdateOrder() {
  const { orderid } = useParams();
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalStatus, setModalStatus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuItemsRes, orderRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_BASE_URL}/api/menuitems`),
          fetch(`${import.meta.env.VITE_BASE_URL}/api/orders/${orderid}`),
        ]);

        const menuItemsData = await menuItemsRes.json();
        const orderData = await orderRes.json();

        setMenuItems(menuItemsData);
        setOrderStatus(orderData.order.order_status);

        // Map existing order items with excluded ingredients
        setSelectedOrderItems(
          orderData.order.order_items.map((item) => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            excluded_ingredients: Array.isArray(item.excluded_ingredients)
              ? item.excluded_ingredients
              : item.excluded_ingredients
              ? JSON.parse(item.excluded_ingredients) // Parse JSON string
              : [], // Default to an empty array
          }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [orderid]);

  // Get unique categories
  const categories = menuItems.reduce((acc, item) => {
    if (!acc.find((cat) => cat.id === item.category.id)) {
      acc.push(item.category);
    }
    return acc;
  }, []);

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === null || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleMenuItemToggle = (menuItemId) => {
    if (orderStatus !== "pending") return;

    setSelectedOrderItems((prev) => {
      const existingItem = prev.find(
        (item) => item.menu_item_id === menuItemId
      );

      if (existingItem) {
        return prev.filter((item) => item.menu_item_id !== menuItemId);
      } else {
        return [
          ...prev,
          {
            menu_item_id: menuItemId,
            quantity: 1,
            excluded_ingredients: [],
          },
        ];
      }
    });
  };

  const handleQuantityChange = (menuItemId, quantity) => {
    if (orderStatus !== "pending") return;

    setSelectedOrderItems((prev) =>
      prev.map((item) =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: quantity }
          : item
      )
    );
  };

  const handleIngredientToggle = (menuItemId, ingredientId) => {
    if (orderStatus !== "pending") return;

    setSelectedOrderItems((prev) =>
      prev.map((item) => {
        if (item.menu_item_id === menuItemId) {
          const excludedIngredients = item.excluded_ingredients.includes(
            ingredientId
          )
            ? item.excluded_ingredients.filter((id) => id !== ingredientId)
            : [...item.excluded_ingredients, ingredientId];
          return { ...item, excluded_ingredients: excludedIngredients };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (orderStatus !== "pending") {
      setModalStatus(false);
      setModalMessage("Order cannot be updated as it is not pending.");
      setLoading(false);
      return;
    }

    const orderData = {
      order_items: selectedOrderItems.map((item) => ({
        ...item,
        excluded_ingredients: Array.isArray(item.excluded_ingredients)
          ? item.excluded_ingredients
          : item.excluded_ingredients
          ? JSON.parse(item.excluded_ingredients) // Parse JSON string
          : [], // Default to an empty array
      })),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/orders/${orderid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();
      console.log(data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order");
      }

      setModalStatus(true);
      setModalMessage(data.message || "Order updated successfully!");
      setTimeout(() => {
        navigate("/orderlist");
      }, 1000);
    } catch (error) {
      console.error("Error updating order:", error);
      setModalStatus(false);
      setModalMessage(error.message || "Failed to update order.");
    } finally {
      setLoading(false);
    }
  };

  const getTotalPrice = () => {
    return selectedOrderItems.reduce((total, orderItem) => {
      const menuItem = menuItems.find(
        (item) => item.id === orderItem.menu_item_id
      );
      if (menuItem) {
        return total + Number.parseFloat(menuItem.price) * orderItem.quantity;
      }
      return total;
    }, 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-500";
      case "processing":
        return "bg-yellow-500";
      case "ready":
        return "bg-green-700";
      case "completed":
        return "bg-gray-800";
      case "canceled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <section className="p-6">
      <div className="w-full">
        <div className="flex justify-between items-center pr-8 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Update Order #{orderid}</h1>
            <p className="text-gray-500">
              Update the menu items for the order here.
            </p>
          </div>
          <div className="text-right">
            <div
              className={`${getStatusColor(
                orderStatus
              )} h-10 flex justify-center items-center rounded-md text-white font-semibold px-5 mb-2`}
            >
              {orderStatus.toUpperCase()}
            </div>
            {selectedOrderItems.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <FaShoppingCart />
                  <span>Selected Items: {selectedOrderItems.length}</span>
                </div>
                <p className="text-lg font-bold">
                  Total: {getTotalPrice().toFixed(2)} ETB
                </p>
              </div>
            )}
          </div>
        </div>

        {orderStatus !== "pending" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex items-center gap-2">
              <FaExclamationTriangle className="text-yellow-600" />
              <p className="text-yellow-800 font-medium">
                This order cannot be edited because its status is "{orderStatus}
                ". Only pending orders can be modified.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Actions */}
            <div className="space-y-6">
              {/* Order Status Info */}
              <div className="bg-white rounded-md p-4 border">
                <label className="block font-medium mb-2">Order Status</label>
                <div
                  className={`${getStatusColor(
                    orderStatus
                  )} text-white px-4 py-2 rounded-md text-center font-medium`}
                >
                  {orderStatus.toUpperCase()}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {orderStatus === "pending"
                    ? "You can modify this order"
                    : "This order cannot be modified"}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium transition-colors ${
                  loading || orderStatus !== "pending"
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer"
                }`}
                disabled={loading || orderStatus !== "pending"}
              >
                {loading ? "Updating Order..." : "Update Order"}
              </button>
            </div>

            {/* Right Column - Menu Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Search and Filter */}
              <div className="bg-white rounded-md p-4 border">
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search menu items..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                      disabled={orderStatus !== "pending"}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    disabled={orderStatus !== "pending"}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    } ${
                      orderStatus !== "pending"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      disabled={orderStatus !== "pending"}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${
                        orderStatus !== "pending"
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-4">
                {filteredMenuItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No menu items found matching your criteria.
                  </div>
                ) : (
                  filteredMenuItems.map((menuItem) => {
                    const orderItem = selectedOrderItems.find(
                      (item) => item.menu_item_id === menuItem.id
                    );
                    return (
                      <MenuItemCard
                        key={menuItem.id}
                        menuItem={menuItem}
                        isSelected={!!orderItem}
                        quantity={orderItem?.quantity || 1}
                        excludedIngredients={
                          orderItem?.excluded_ingredients || []
                        }
                        onToggle={() => handleMenuItemToggle(menuItem.id)}
                        onQuantityChange={(quantity) =>
                          handleQuantityChange(menuItem.id, quantity)
                        }
                        onIngredientToggle={(ingredientId) =>
                          handleIngredientToggle(menuItem.id, ingredientId)
                        }
                        disabled={orderStatus !== "pending"}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </form>

        {modalStatus !== null && (
          <MessageModal
            isItError={!modalStatus}
            message={modalMessage}
            closeMessageBackdrop={() => setModalStatus(null)}
          />
        )}
      </div>
    </section>
  );
}

export default UpdateOrder;
