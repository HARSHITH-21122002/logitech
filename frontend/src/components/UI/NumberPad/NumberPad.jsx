import { motion } from "framer-motion"
import { Grid } from "@mui/material"
import "./NumberPad.css"

const NumberPad = ({ onNumberClick, className = "" }) => {
  const numberPad = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["C", "0", "⌫"],
  ]

  return (
    <div className={`number-pad ${className}`}>
      <Grid container spacing={1}>
        {numberPad.map((row, rowIndex) =>
          row.map((num, colIndex) => (
            <Grid item xs={4} key={`${rowIndex}-${colIndex}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="number-pad__button"
                onClick={() => onNumberClick(num)}
              >
                {num}
              </motion.button>
            </Grid>
          )),
        )}
      </Grid>
    </div>
  )
}

export default NumberPad
