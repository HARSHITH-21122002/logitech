import { motion } from "framer-motion"
import "./ProductCard.css"

const ProductCard = ({ product, onSelect, className = "" }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`product-card ${className}`}
      onClick={() => onSelect(product)}
    >
      <div className="product-card__image">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="product-card__img"
        />
      </div>
      <div className="product-card__content">
        <h6 className="product-card__name">{product.name}</h6>
        <div className="product-card__price">
          <span className="product-card__price-text">₹{product.price}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default ProductCard


