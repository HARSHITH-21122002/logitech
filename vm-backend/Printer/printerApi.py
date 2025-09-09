# =============================================================
# --- IMPORTS ---
# =============================================================
import os
import base64
from flask import Flask, request, jsonify, Blueprint
import win32print
import win32ui
from PIL import Image, ImageDraw, ImageFont, ImageWin
from datetime import datetime
import logging

# --- (REQUIRED) ADD YOUR DATABASE AND MODEL IMPORTS HERE ---
from app.database import SessionLocal
from models.models import products_bvc
# -------------------------------------------------------------

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

bill_print = Blueprint("printerApi", __name__)

# =============================================================
# --- FONT DEFINITIONS (Refined for professional look) ---
# =============================================================
try:
    arial_bold_path = "arialbd.ttf" if os.path.exists("arialbd.ttf") else "arial.ttf"
    FONT_TITLE = ImageFont.truetype("arial.ttf", 34)       # Slightly smaller title
    FONT_HEADER = ImageFont.truetype("arial.ttf", 26)      # Bill type header
    FONT_BODY_BOLD = ImageFont.truetype(arial_bold_path, 20) # Bold body text
    FONT_BODY = ImageFont.truetype("arial.ttf", 19)        # Regular body text
    FONT_SMALL = ImageFont.truetype("arial.ttf", 15)       # For address, GSTIN
    FONT_MONO_BOLD = ImageFont.truetype("courbd.ttf", 20)  # Monospace Bold for table headers/totals
    FONT_MONO = ImageFont.truetype("cour.ttf", 19)         # Monospace for numbers
except Exception as e:
    logger.error(f"Font loading failed: {e}. Using default fonts.")
    FONT_TITLE = ImageFont.load_default(size=34)
    FONT_HEADER = ImageFont.load_default(size=26)
    FONT_BODY_BOLD = ImageFont.load_default(size=20)
    FONT_BODY = ImageFont.load_default(size=19)
    FONT_SMALL = ImageFont.load_default(size=15)
    FONT_MONO_BOLD = ImageFont.load_default(size=20)
    FONT_MONO = ImageFont.load_default(size=19)

# =============================================================
# --- HELPER DRAWING FUNCTIONS (Improved Spacing) ---
# =============================================================
def draw_separator_line(draw, y, width, char="-", margin=20):
    """Draw a separator line with consistent spacing"""
    font = FONT_MONO_BOLD
    char_width = draw.textlength(char, font=font)
    num_chars = int((width - (margin * 2)) / char_width) if char_width > 0 else 50
    line = char * num_chars
    draw.text((margin, y), line, font=font, fill="black")
    return y + 25  # Consistent spacing after separator

def draw_centered_text(draw, text, y, width, font, fill="black", bottom_margin=8):
    """Draw centered text with consistent spacing"""
    text = str(text).replace('\n', ' ')
    text_width = draw.textlength(text, font=font)
    x = (width - text_width) // 2
    draw.text((x, y), text, font=font, fill=fill)
    return y + font.size + bottom_margin

def draw_aligned_row(draw, left_text, right_text, y, width, font, left_margin=25, right_margin=25, bottom_margin=6):
    """Draw left-right aligned text with consistent margins"""
    left_text = str(left_text).replace('\n', ' ')
    right_text = str(right_text).replace('\n', ' ')
    
    # Draw left text
    draw.text((left_margin, y), left_text, font=font, fill="black")
    
    # Draw right text if provided
    if right_text:
        right_width = draw.textlength(right_text, font=font)
        right_x = width - right_width - right_margin
        draw.text((right_x, y), right_text, font=font, fill="black")
    
    return y + font.size + bottom_margin

def draw_table_row(draw, y, width, item, rate, qty, amount, is_header=False):
    """Draw table row with properly aligned columns"""
    font_text = FONT_BODY_BOLD if is_header else FONT_BODY
    font_num = FONT_MONO_BOLD if is_header else FONT_MONO
    
    item, rate, qty, amount = str(item), str(rate), str(qty), str(amount)
    
    # Column positions (improved alignment)
    X_ITEM = 25          # Item name - left aligned
    X_RATE = 300         # Rate - left aligned
    X_QTY = 395          # Quantity - left aligned
    X_AMOUNT_MARGIN = 25 # Amount - right aligned with margin
    
    # Truncate item name if too long (but not for headers)
    if not is_header and len(item) > 24:
        item = item[:22] + ".."
    
    # Draw item name
    draw.text((X_ITEM, y), item, font=font_text, fill="black")
    
    # Draw rate
    draw.text((X_RATE, y), rate, font=font_num, fill="black")
    
    # Draw quantity
    draw.text((X_QTY, y), qty, font=font_num, fill="black")
    
    # Draw amount (right-aligned)
    amount_width = draw.textlength(amount, font=font_num)
    draw.text((width - amount_width - X_AMOUNT_MARGIN, y), amount, font=font_num, fill="black")
    
    # Consistent row spacing
    row_spacing = 8 if is_header else 6
    return y + font_text.size + row_spacing

# =============================================================
# --- SPECIALIZED BILL DRAWING LOGIC (Improved Layout) ---
# =============================================================

def draw_acknowledgement_bill(draw, data, width, session):
    y = 20  # Start with consistent top margin
    
    # Company name with proper spacing
    y = draw_centered_text(draw, data.get('company_name', "SMART VENDING"), y, width, FONT_TITLE, bottom_margin=10)
    
    # Company address section with professional boxing
    y = draw_separator_line(draw, y, width, char="-")
    y += 5  # Small gap after line
    
    # Address centered and well-spaced
    y = draw_centered_text(draw, data.get('company_address', "Main Building Lobby"), y, width, FONT_BODY, bottom_margin=6)
    y = draw_centered_text(draw, f"GSTIN: {data.get('gst_number', 'N/A')}", y, width, FONT_BODY, bottom_margin=8)
    
    y = draw_separator_line(draw, y, width, char="-")
    y += 8  # Consistent spacing after address section

    # Bill details section
    y = draw_aligned_row(draw, f"BILL NO: {data.get('order_id', 'N/A')}", "", y, width, FONT_BODY)
    
    machine_name = data.get('machine_name', 'N/A')
    y = draw_aligned_row(draw, f"BILL BY: {machine_name}", "", y, width, FONT_BODY)
    
    # Date and time on same line
    datetime_str = data.get('datetime', datetime.now().strftime("%d/%m/%Y, %H:%M:%S"))
    if ',' in datetime_str:
        date_part, time_part = datetime_str.split(',')
        y = draw_aligned_row(draw, f"DATE: {date_part.strip()}", f"TIME: {time_part.strip()}", y, width, FONT_BODY)
    else:
        y = draw_aligned_row(draw, f"DATE: {datetime_str}", "", y, width, FONT_BODY)
    
    y += 5  # Space before table
    y = draw_separator_line(draw, y, width)

    # Table header
    y = draw_table_row(draw, y, width, "ITEM", "RATE", "QTY", "AMOUNT", is_header=True)
    y = draw_separator_line(draw, y - 5, width)  # Closer to header

    # Calculate totals
    calculated_sub_total = 0
    calculated_total_cgst = 0
    calculated_total_sgst = 0
    grand_total = 0
    
    # Table rows
    for item in data.get('items', []):
        final_price_per_item = item.get('price', 0)
        qty = item.get('qty', 0)
        product_id = item.get('product_id')
        
        gst_rate = 0
        if product_id:
            db_product = session.query(products_bvc).filter(products_bvc.product_id == product_id).first()
            if db_product and db_product.GST:
                gst_rate = db_product.GST
        
        base_price_per_item = final_price_per_item / (1 + (gst_rate / 100)) if gst_rate > 0 else final_price_per_item
        total_tax_for_item = final_price_per_item - base_price_per_item
        total_item_base_price = base_price_per_item * qty
        total_item_final_price = final_price_per_item * qty
        
        calculated_sub_total += total_item_base_price
        calculated_total_cgst += (total_tax_for_item * qty) / 2
        calculated_total_sgst += (total_tax_for_item * qty) / 2
        grand_total += total_item_final_price
        
        y = draw_table_row(draw, y, width, 
                          item.get('name', ''), 
                          f"{base_price_per_item:.2f}", 
                          str(qty), 
                          f"{total_item_base_price:.2f}")

    # Totals section
    y += 5  # Space before totals
    y = draw_separator_line(draw, y, width)
    
    # Sub total
    y = draw_aligned_row(draw, "Sub Total", f"₹{calculated_sub_total:.2f}", y, width, FONT_BODY)
    
    # GST lines (only if applicable)
    if calculated_total_cgst > 0.005:
        y = draw_aligned_row(draw, "CGST", f"₹{calculated_total_cgst:.2f}", y, width, FONT_BODY)
        y = draw_aligned_row(draw, "SGST", f"₹{calculated_total_sgst:.2f}", y, width, FONT_BODY)

    # Grand total with emphasis
    y += 5  # Extra space before grand total
    y = draw_separator_line(draw, y, width, char="=")
    y = draw_aligned_row(draw, "TOTAL AMOUNT", f"₹{grand_total:.2f}", y, width, FONT_BODY_BOLD, bottom_margin=10)
    
    # Payment details section
    y += 8  # Space before payment details
    payment_details = data.get('payment_details', {})
    payment_method = payment_details.get('method', 'Unknown')
    y = draw_aligned_row(draw, "Payment Type:", payment_method, y, width, FONT_BODY)
    
    if payment_method == 'Account':
        y = draw_aligned_row(draw, "Initial Balance:", f"₹{payment_details.get('initialBalance', 0):.2f}", y, width, FONT_BODY)
        y = draw_aligned_row(draw, "Final Balance:", f"₹{payment_details.get('finalBalance', 0):.2f}", y, width, FONT_BODY)
    
    # Footer
    y += 10  # Space before footer
    y = draw_separator_line(draw, y, width, char="=")
    y = draw_centered_text(draw, "Thank You! Visit Again!", y, width, FONT_BODY_BOLD, bottom_margin=15)
    
    return y

def draw_purchase_bill(draw, data, width):
    y = 20  # Consistent top margin
    
    # Company name and bill type
    y = draw_centered_text(draw, data.get('company_name', "SMART VENDING"), y, width, FONT_TITLE, bottom_margin=8)
    y = draw_centered_text(draw, "ACKNOWLEDGEMENT BILL", y, width, FONT_HEADER, bottom_margin=12)
    y = draw_separator_line(draw, y, width)

    # Bill details
    y += 8
    y = draw_aligned_row(draw, f"BILL NO: {data.get('order_id', 'N/A')}", "", y, width, FONT_BODY)
    
    machine_name = data.get('machine_name', 'N/A')
    y = draw_aligned_row(draw, f"BILL BY: {machine_name}", "", y, width, FONT_BODY)
    
    datetime_str = data.get('datetime', datetime.now().strftime("%d/%m/%Y, %H:%M:%S"))
    if ',' in datetime_str:
        date_part, time_part = datetime_str.split(',')
        y = draw_aligned_row(draw, f"DATE: {date_part.strip()}", f"TIME: {time_part.strip()}", y, width, FONT_BODY)
    else:
        y = draw_aligned_row(draw, f"DATE: {datetime_str}", "", y, width, FONT_BODY)
    
    y += 5
    y = draw_separator_line(draw, y, width)
    
    # Table header
    y = draw_table_row(draw, y, width, "ITEM", "RATE", "QTY", "AMOUNT", is_header=True)
    y = draw_separator_line(draw, y - 5, width)
    
    # Table rows
    total_amount = 0
    for item in data.get('items', []):
        price = item.get('price', 0)
        qty = item.get('qty', 0)
        amount = price * qty
        total_amount += amount
        y = draw_table_row(draw, y, width, 
                          item.get('name', ''), 
                          f"{price:.2f}", 
                          str(qty), 
                          f"{amount:.2f}")
    
    # Total
    y += 5
    y = draw_separator_line(draw, y, width)
    y = draw_aligned_row(draw, "TOTAL AMOUNT", f"₹{total_amount:.2f}", y, width, FONT_BODY_BOLD, bottom_margin=15)
    
    return y

# =============================================================
# --- MAIN GENERATOR AND PRINTER FUNCTIONS ---
# =============================================================
def generate_bill_image(data, session):
    try:
        width = 576
        temp_image = Image.new("RGB", (width, 2500), "white")
        temp_draw = ImageDraw.Draw(temp_image)

        if data.get('bill_type') == "acknowledgement":
            final_y = draw_acknowledgement_bill(temp_draw, data, width, session)
        else:
            final_y = draw_purchase_bill(temp_draw, data, width)
        
        height = final_y + 20  # Consistent bottom margin
        image = Image.new("RGB", (width, height), "white")
        draw = ImageDraw.Draw(image)
        
        if data.get('bill_type') == "acknowledgement":
            draw_acknowledgement_bill(draw, data, width, session)
        else:
            draw_purchase_bill(draw, data, width)
        
        return image
        
    except Exception as e:
        logger.error(f"Error in generate_bill_image: {e}", exc_info=True)
        error_image = Image.new("RGB", (576, 200), "white")
        draw = ImageDraw.Draw(error_image)
        draw.text((20, 20), "Error generating bill.", font=FONT_BODY, fill="red")
        draw.text((20, 50), f"Details: {e}", font=FONT_SMALL, fill="black")
        return error_image

def print_image(image):
    try:
        printer_name = win32print.GetDefaultPrinter()
        logger.info(f"Using printer: {printer_name}")
        hprinter = win32print.OpenPrinter(printer_name)
        try:
            hdc = win32ui.CreateDC()
            hdc.CreatePrinterDC(printer_name)
            hdc.StartDoc("Receipt - Order Bill")
            hdc.StartPage()
            dib = ImageWin.Dib(image)
            printer_width = hdc.GetDeviceCaps(8)
            scale_factor = printer_width / image.width
            scaled_width = int(image.width * scale_factor)
            scaled_height = int(image.height * scale_factor)
            dib.draw(hdc.GetHandleOutput(), (0, 0, scaled_width, scaled_height))
            hdc.EndPage()
            hdc.EndDoc()
            hdc.DeleteDC()
        finally:
            win32print.ClosePrinter(hprinter)
        logger.info("Print job completed successfully")
    except ImportError:
        logger.error("pywin32 is not installed. Cannot print on Windows. Saving image instead.")
        image.save("bill_output.png")
    except Exception as e:
        logger.error(f"Error in print_image: {e}", exc_info=True)
        raise

# =============================================================
# --- FLASK ROUTES ---
# =============================================================
@bill_print.route('/print/bill', methods=["POST"])
def print_bill():
    session = SessionLocal()
    try:
        data = request.json
        if not data:
            logger.error("No JSON data received in request")
            return jsonify({"status": "error", "message": "No data received"}), 400

        logger.debug(f"Received bill data: {data}")
        bill_image = generate_bill_image(data, session)
        print_image(bill_image)

        return jsonify({"status": "success", "message": f"{data.get('bill_type', 'unknown').capitalize()} bill printed successfully."})
    except Exception as e:
        logger.error(f"Error in print_bill: {e}", exc_info=True)
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if session:
            session.close()

@bill_print.route('/printer/default', methods=["GET"])
def get_printer():
    try:
        printer = win32print.GetDefaultPrinter()
        logger.info(f"Default printer: {printer}")
        return jsonify({"status": "success", "printer": printer})
    except Exception as e:
        logger.error(f"Error in get_printer: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500