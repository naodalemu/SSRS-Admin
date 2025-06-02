import { useState } from "react"

export default function MenuItemCard({
  menuItem,
  isSelected,
  quantity,
  excludedIngredients,
  onToggle,
  onQuantityChange,
  onIngredientToggle,
  disabled = false,
}) {
  const [showDetails, setShowDetails] = useState(false)

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
  }

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isSelected ? "border-gray-800 bg-gray-50" : "border-gray-200"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="flex-shrink-0">
          <img
            src={`${import.meta.env.VITE_BASE_URL}/storage/${menuItem.image}`}
            alt={menuItem.name}
            className="w-20 h-20 object-cover rounded-md"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{menuItem.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{truncateText(menuItem.description, 100)}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium">{menuItem.price.slice(0, -3)} ETB</span>
                <span>{menuItem.total_calorie} Cal/100g</span>
              </div>
            </div>

            {/* Selection Button */}
            <button
              type="button"
              onClick={onToggle}
              disabled={disabled}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isSelected ? "bg-gray-800 text-white" : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {menuItem.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{tag.name}
              </span>
            ))}
            {menuItem.tags.length > 3 && (
              <span className="text-gray-400 text-xs">+{menuItem.tags.length - 3} more</span>
            )}
          </div>

          {/* Quantity Input */}
          {isSelected && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  disabled={disabled}
                  className="px-2 py-1 bg-gray-800 text-white rounded-l-md hover:bg-gray-700 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => onQuantityChange(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  disabled={disabled}
                  className="w-16 px-2 py-1 text-center border-t border-b border-gray-300 focus:outline-none"
                  min="1"
                />
                <button
                  type="button"
                  onClick={() => onQuantityChange(quantity + 1)}
                  disabled={disabled}
                  className="px-2 py-1 bg-gray-800 text-white rounded-r-md hover:bg-gray-700 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="ml-4 text-sm text-blue-600 hover:text-blue-800"
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </button>
            </div>
          )}

          {/* Detailed View */}
          {isSelected && showDetails && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Ingredients:</h4>
              <div className="grid grid-cols-2 gap-2">
                {menuItem.ingredients.map((ingredient) => (
                  <label
                    key={ingredient.id}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      excludedIngredients.includes(ingredient.id)
                        ? "bg-red-100 text-red-700 line-through"
                        : "bg-white hover:bg-gray-100"
                    } ${disabled ? "cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={excludedIngredients.includes(ingredient.id)}
                      onChange={() => onIngredientToggle(ingredient.id)}
                      disabled={disabled}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {ingredient.name} ({ingredient.pivot.quantity}g)
                    </span>
                  </label>
                ))}
              </div>
              {excludedIngredients.length > 0 && (
                <p className="text-xs text-red-600 mt-2">✓ Checked ingredients will be excluded from this item</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
