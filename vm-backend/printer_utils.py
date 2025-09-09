# # from PIL import Image
# # import win32print
# # import win32ui
# # import win32con
# # import io

# # def print_image_from_memory(image_data):
# #     printer_name = win32print.GetDefaultPrinter()
# #     hPrinter = win32print.OpenPrinter(printer_name)
# #     hDC = win32ui.CreateDC()
# #     hDC.CreatePrinterDC(printer_name)

# #     img = Image.open(io.BytesIO(image_data))
# #     img = img.convert("RGB")  # Ensure format
# #     img = img.resize((384, int(img.height * (384 / img.width))))  # Resize to fit 3-inch paper

# #     hDC.StartDoc("Receipt Print")
# #     hDC.StartPage()

# #     dib = win32ui.CreateBitmap()
# #     dib.CreateCompatibleBitmap(hDC, img.width, img.height)
# #     hDC.SelectObject(dib)

# #     dib.FromBitmapBits(img.tobytes())
# #     hDC.BitBlt((0, 0), (img.width, img.height), hDC, (0, 0), win32con.SRCCOPY)

# #     hDC.EndPage()
# #     hDC.EndDoc()
# #     hDC.DeleteDC()
# #     win32print.ClosePrinter(hPrinter)

# #dumyyyyyy
# # import win32print
# # import win32ui
# # from PIL import Image, ImageWin
# # import io

# # def print_image_from_memory(image_bytes):
# #     # Load image from memory
# #     image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

# #     # Resize if needed (adjust width)
# #     width = 384
# #     wpercent = (width / float(image.size[0]))
# #     hsize = int((float(image.size[1]) * float(wpercent)))
# #     image = image.resize((width, hsize), Image.LANCZOS)

# #     # Get printer
# #     printer_name = win32print.GetDefaultPrinter()
# #     hprinter = win32print.OpenPrinter(printer_name)
# #     printer_info = win32print.GetPrinter(hprinter, 2)
# #     win32print.ClosePrinter(hprinter)

# #     hdc = win32ui.CreateDC()
# #     hdc.CreatePrinterDC(printer_name)
# #     hdc.StartDoc("Image Print Job")
# #     hdc.StartPage()

# #     dib = ImageWin.Dib(image)
# #     dib.draw(hdc.GetHandleOutput(), (0, 0, width, hsize))

# #     hdc.EndPage()
# #     hdc.EndDoc()
# #     hdc.DeleteDC()

# import win32print
# import win32ui
# from PIL import Image, ImageDraw, ImageFont, ImageWin
# import io

# def print_receipt_from_data(order_data):
#     # Example order_data:
#     # {
#     #   "store": "BVC JUICE VENDING",
#     #   "items": [{"name": "Orange Juice", "qty": 1, "price": 30}],
#     #   "total": 30,
#     #   "footer": "Thank you!"
#     # }

#     width, height = 384, 600  # Adjust based on your printer resolution
#     image = Image.new("L", (width, height), "white")
#     draw = ImageDraw.Draw(image)

#     try:
#         font = ImageFont.truetype("arial.ttf", 20)
#     except:
#         font = ImageFont.load_default()

#     y = 10
#     draw.text((10, y), order_data.get("store", "Store Name"), font=font, fill=0)
#     y += 40
#     draw.text((10, y), "------------------------------", font=font, fill=0)
#     y += 30

#     for item in order_data["items"]:
#         line = f"{item['name']} x{item['qty']} - ₹{item['price']}"
#         draw.text((10, y), line, font=font, fill=0)
#         y += 30

#     y += 10
#     draw.text((10, y), "------------------------------", font=font, fill=0)
#     y += 30
#     draw.text((10, y), f"Total: ₹{order_data['total']}", font=font, fill=0)
#     y += 40
#     draw.text((10, y), order_data.get("footer", "Thank you!"), font=font, fill=0)

#     # Send to printer
#     hprinter = win32print.OpenPrinter(win32print.GetDefaultPrinter())
#     hdc = win32ui.CreateDC()
#     hdc.CreatePrinterDC(win32print.GetDefaultPrinter())
#     hdc.StartDoc("Receipt")
#     hdc.StartPage()

#     dib = ImageWin.Dib(image)
#     dib.draw(hdc.GetHandleOutput(), (0, 0, width, height))

#     hdc.EndPage()
#     hdc.EndDoc()
#     hdc.DeleteDC()
