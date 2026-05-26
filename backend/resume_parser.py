import fitz  # PyMuPDF

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Takes raw binary bytes of a PDF file, loops through 
    all pages, and extracts the text into a clean string.
    """
    # Open the PDF document from the raw memory stream
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""

    # Extract text from each page
    for page in doc:
        text += page.get_text()

    return text.strip()