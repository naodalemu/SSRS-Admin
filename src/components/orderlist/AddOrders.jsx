import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { FaSearch, FaShoppingCart } from "react-icons/fa"
import MessageModal from "../ui/MessageModal"
import MenuItemCard from "./MenuItemCard"

function AddOrders() {
  const [menuItems, setMenuItems] = useState([])
  const [selectedOrderItems, setSelectedOrderItems] = useState([])
  const [tableNumber, setTableNumber] = useState("")
  const [orderType, setOrderType] = useState("dine-in")
  const [loading, setLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [modalStatus, setModalStatus] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const navigate = useNavigate()

  const customerIp = "0.0.0.0"
  const customerTempId = "staffPage"

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/menuitems`)
        const data = await response.json()
        setMenuItems(data)
      } catch (error) {
        console.error("Error fetching menu items:", error)
      }
    }

    fetchMenuItems()
  }, [])

  // Get unique categories
  const categories = menuItems.reduce((acc, item) => {
    if (!acc.find((cat) => cat.id === item.category.id)) {
      acc.push(item.category)
    }
    return acc
  }, [])

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleMenuItemToggle = (menuItemId) => {
    setSelectedOrderItems((prev) => {
      const existingItem = prev.find((item) => item.menu_item_id === menuItemId)

      if (existingItem) {
        return prev.filter((item) => item.menu_item_id !== menuItemId)
      } else {
        return [
          ...prev,
          {
            menu_item_id: menuItemId,
            quantity: 1,
            excluded_ingredients: [],
          },
        ]
      }
    })
  }

  const handleQuantityChange = (menuItemId, quantity) => {
    setSelectedOrderItems((prev) =>
      prev.map((item) => (item.menu_item_id === menuItemId ? { ...item, quantity: quantity } : item)),
    )
  }

  const handleIngredientToggle = (menuItemId, ingredientId) => {
    setSelectedOrderItems((prev) =>
      prev.map((item) => {
        if (item.menu_item_id === menuItemId) {
          const excludedIngredients = item.excluded_ingredients.includes(ingredientId)
            ? item.excluded_ingredients.filter((id) => id !== ingredientId)
            : [...item.excluded_ingredients, ingredientId]
          return { ...item, excluded_ingredients: excludedIngredients }
        }
        return item
      }),
    )
  }

  const handleOrderTypeChange = (type) => {
    setOrderType(type)
    if (type === "remote") {
      setTableNumber("")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if ((orderType === "dine-in" && !tableNumber) || selectedOrderItems.length === 0) {
      setModalStatus(false)
      setModalMessage("Please fill in all required fields.")
      setLoading(false)
      return
    }

    const orderData = {
      table_number: orderType === "dine-in" ? tableNumber : null,
      order_items: selectedOrderItems,
      customer_ip: customerIp,
      customer_temp_id: customerTempId,
      order_type: orderType,
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/orders/guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order")
      }

      setModalStatus(true)
      setModalMessage(data.message || "Order placed successfully!")
      setTimeout(() => {
        navigate("/orderlist")
      }, 1000)
    } catch (error) {
      console.error("Error placing order:", error)
      setModalStatus(false)
      setModalMessage(error.message || "Failed to place order.")
    } finally {
      setLoading(false)
    }
  }

  const getTotalPrice = () => {
    return selectedOrderItems.reduce((total, orderItem) => {
      const menuItem = menuItems.find((item) => item.id === orderItem.menu_item_id)
      if (menuItem) {
        return total + Number.parseFloat(menuItem.price) * orderItem.quantity
      }
      return total
    }, 0)
  }

  return (
    <section className="p-6">
      <div className="w-full">
        <div className="flex justify-between items-center pr-8 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Add Order</h1>
            <p className="text-gray-500">Create a new order by selecting menu items and specifying details.</p>
          </div>
          {selectedOrderItems.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <FaShoppingCart />
                <span>Selected Items: {selectedOrderItems.length}</span>
              </div>
              <p className="text-lg font-bold">Total: {getTotalPrice().toFixed(2)} ETB</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="space-y-6">
              {/* Table Number */}
              <div className="bg-white rounded-md p-4 border">
                <label className="block font-medium mb-2">Table Number</label>
                <input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                  placeholder={orderType === "remote" ? "Not required for remote orders" : "Enter table number"}
                  disabled={orderType === "remote"}
                />
              </div>

              {/* Order Type */}
              <div className="bg-white rounded-md p-4 border">
                <label className="block font-medium mb-2">Order Type</label>
                <div className="flex gap-2">
                  {["dine-in", "remote"].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => handleOrderTypeChange(type)}
                      className={`flex-1 px-4 py-2 border rounded-md font-medium transition-colors ${
                        orderType === type ? "bg-gray-800 text-white" : "bg-white text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-md font-medium transition-colors ${
                  loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                }`}
                disabled={loading}
              >
                {loading ? "Placing Order..." : "Place Order"}
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
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedCategory === null
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  <div className="text-center py-8 text-gray-500">No menu items found matching your criteria.</div>
                ) : (
                  filteredMenuItems.map((menuItem) => {
                    const orderItem = selectedOrderItems.find((item) => item.menu_item_id === menuItem.id)
                    return (
                      <MenuItemCard
                        key={menuItem.id}
                        menuItem={menuItem}
                        isSelected={!!orderItem}
                        quantity={orderItem?.quantity || 1}
                        excludedIngredients={orderItem?.excluded_ingredients || []}
                        onToggle={() => handleMenuItemToggle(menuItem.id)}
                        onQuantityChange={(quantity) => handleQuantityChange(menuItem.id, quantity)}
                        onIngredientToggle={(ingredientId) => handleIngredientToggle(menuItem.id, ingredientId)}
                      />
                    )
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
  )
}

export default AddOrders
