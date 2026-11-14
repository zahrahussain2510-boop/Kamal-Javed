from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfgen import canvas
from PIL import Image, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "Kamal-Javed-Professional-Portfolio.pdf"
PORTRAIT = ROOT / "assets" / "cinematic-frames-4k" / "frame-0240.jpg"
TMP = ROOT / "tmp" / "pdfs"
PORTRAIT_DARK = TMP / "portfolio-portrait-dark.jpg"
W, H = A4
INK = HexColor("#080709")
PANEL = HexColor("#121013")
PANEL2 = HexColor("#1a1519")
PAPER = HexColor("#f4f0ed")
MUTED = HexColor("#b8afb5")
RED = HexColor("#f01d3c")
LIME = HexColor("#c8ff00")
PINK = HexColor("#fa37c5")
LINE = HexColor("#3a3038")


def background(c, page, label):
    c.setFillColor(INK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(RED)
    c.rect(0, H - 11, W, 11, fill=1, stroke=0)
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(38, H - 36, "KAMAL JAVED")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawRightString(W - 38, H - 36, "INDEPENDENT WEBSITE DESIGN + DEVELOPMENT")
    c.setStrokeColor(LINE)
    c.line(38, H - 47, W - 38, H - 47)
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(38, H - 70, f"{page:02d} / 12     {label.upper()}")
    c.setStrokeColor(LINE)
    c.line(38, 35, W - 38, 35)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(38, 22, "PAKISTAN  /  UNITED STATES  /  UNITED KINGDOM")
    c.drawRightString(W - 38, 22, f"{page:02d}")


def title(c, heading, subheading, y=H - 122):
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 29)
    c.drawString(38, y, heading)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Oblique", 24)
    c.drawString(38, y - 31, subheading)
    return y - 63


def paragraph(c, text, x, y, width, size=10, leading=15, color=MUTED, font="Helvetica"):
    c.setFillColor(color)
    c.setFont(font, size)
    lines = simpleSplit(text, font, size, width)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def label(c, text, x, y, color=RED):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x, y, text.upper())


def card(c, x, y, w, h, heading, body, number=None):
    c.setFillColor(PANEL)
    c.roundRect(x, y - h, w, h, 7, fill=1, stroke=0)
    c.setStrokeColor(LINE)
    c.roundRect(x, y - h, w, h, 7, fill=0, stroke=1)
    if number:
        c.setFillColor(LIME)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(x + 14, y - 23, number)
        top = y - 47
    else:
        top = y - 24
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x + 14, top, heading)
    paragraph(c, body, x + 14, top - 21, w - 28, size=8.5, leading=12)


def page(c, number, section, heading, subheading, intro=None):
    background(c, number, section)
    y = title(c, heading, subheading)
    if intro:
        y = paragraph(c, intro, 38, y - 2, W - 76, size=10, leading=15)
    return y - 18


def page_cover(c):
    c.setFillColor(INK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.drawImage(ImageReader(str(PORTRAIT_DARK)), 0, 0, width=W, height=H)
    c.setFillColor(RED)
    c.rect(31, H - 356, 4, 136, fill=1, stroke=0)
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(42, H - 45, "KAMAL JAVED")
    c.setFillColor(LIME)
    c.drawRightString(W - 42, H - 45, "AVAILABLE FOR INTERNATIONAL PROJECTS")
    c.setFillColor(HexColor("#ff183b"))
    c.setFont("Helvetica-Bold", 67)
    c.drawString(35, H - 270, "KAMAL")
    c.drawString(35, H - 334, "JAVED")
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(40, H - 385, "WEBSITE DESIGNER + DEVELOPER")
    paragraph(c, "I plan and build clear, responsive websites for businesses that need to explain their value and make the next step easy to take.", 40, H - 423, 300, size=10, leading=15, color=PAPER)
    c.setFillColor(LIME)
    c.rect(40, 118, 38, 3, fill=1, stroke=0)
    c.setFillColor(PAPER)
    c.setFont("Helvetica", 9)
    c.drawString(40, 97, "DESIGN THINKING  /  FRONT END DEVELOPMENT")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(40, 76, "PAKISTAN  /  WORKING WITH THE UNITED STATES + UNITED KINGDOM")
    c.setStrokeColor(LIME)
    c.setLineWidth(1)
    c.rect(24, 24, W - 48, H - 48, fill=0, stroke=1)
    c.showPage()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    source = Image.open(PORTRAIT).convert("RGB")
    crop_width = round(source.height * W / H)
    left = max(0, (source.width - crop_width) // 2)
    source = source.crop((left, 0, left + crop_width, source.height))
    source = ImageEnhance.Brightness(source).enhance(.42)
    tint = Image.new("RGB", source.size, (39, 5, 13))
    source = Image.blend(source, tint, .24)
    source = source.resize((1190, 1684), Image.Resampling.LANCZOS)
    source.save(PORTRAIT_DARK, "JPEG", quality=90, optimize=True)
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("Kamal Javed | Website Designer and Developer")
    c.setAuthor("Kamal Javed")
    page_cover(c)

    # 02 About me
    y = page(c, 2, "About me", "A website is more than", "a digital brochure.", "It is often the first place a potential customer looks for a clear explanation of what a business does, who it helps and how to take the next step.")
    label(c, "What I do", 38, y)
    paragraph(c, "I independently design and develop complete websites. I can help shape the page structure, organize the message, design the interface and build the responsive front end.", 38, y - 22, 245, size=10, leading=15, color=PAPER)
    label(c, "My approach", 315, y)
    paragraph(c, "Start with the business requirement. Understand the audience. Give each page a purpose. Then develop the experience with attention to content, layout and detail.", 315, y - 22, 240, size=10, leading=15, color=PAPER)
    c.setFillColor(PANEL2)
    c.roundRect(38, 155, W - 76, 112, 8, fill=1, stroke=0)
    label(c, "The aim", 56, 239, LIME)
    paragraph(c, "Make the offer easier to understand, make the experience easier to use and give the visitor a clear path to act.", 56, 215, W - 112, size=17, leading=24, color=PAPER, font="Helvetica-Bold")
    paragraph(c, "I am interested in working directly with founders, business owners and independent teams who value clear communication and careful execution.", 38, 126, W - 76, size=9, leading=14)
    c.showPage()

    # 03 Professional profile
    y = page(c, 3, "Professional profile", "One connected practice.", "Direct communication.", "I work independently so the person understanding the brief can also shape the design and build the website.")
    cards = [
        ("Understand the business", "Clarify the offer, audience, goals and the questions a visitor needs answered."),
        ("Structure the experience", "Organize pages and information so the important message is easy to find."),
        ("Design and develop", "Create a considered interface and implement it as a responsive front end."),
        ("Stay close to the work", "Keep communication direct and decisions connected to the agreed requirements."),
    ]
    x0, gap, cw, ch = 38, 12, (W - 88) / 2, 116
    for i, (head, body) in enumerate(cards):
        x = x0 + (i % 2) * (cw + gap)
        yy = y - (i // 2) * (ch + 13)
        card(c, x, yy, cw, ch, head, body, f"0{i+1}")
    label(c, "Professional objective", 38, 259, LIME)
    paragraph(c, "Build a direct working relationship with businesses in the United States and United Kingdom, then deliver a website that reflects their offer with clarity and care.", 38, 238, W - 76, size=11, leading=16, color=PAPER)
    c.showPage()

    # 04 Skills
    page(c, 4, "Technical skills", "A practical front end", "foundation.", "The skills below reflect the work this portfolio demonstrates. No additional frameworks, platforms or certifications are claimed.")
    skill_rows = [
        ("HTML", "Build semantic page structures and organize content into clear sections."),
        ("CSS", "Create visual systems, responsive layouts, typography and interaction states."),
        ("JavaScript", "Add purposeful behaviors and connect interface elements to page state."),
        ("Responsive implementation", "Adapt page structure and visual detail for mobile, tablet and desktop."),
    ]
    yy = 584
    for i, (head, body) in enumerate(skill_rows):
        c.setFillColor(PANEL)
        c.roundRect(38, yy - 92, W - 76, 78, 6, fill=1, stroke=0)
        c.setFillColor(LIME if i % 2 == 0 else PINK)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(54, yy - 37, f"0{i+1}")
        c.setFillColor(PAPER)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(92, yy - 34, head)
        paragraph(c, body, 92, yy - 53, W - 150, size=8.5, leading=12)
        yy -= 101
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(38, 142, "TOOLS AND FRAMEWORKS")
    paragraph(c, "Additional tools or frameworks can be agreed when a project requires them. They are not listed here as existing expertise.", 38, 122, W - 76, size=9, leading=14)
    c.showPage()

    # 05 Services
    page(c, 5, "Services", "A site built around", "the business need.", "Project scope can focus on one page or cover the complete design and front end build.")
    services = [
        ("Website design", "Page hierarchy, content structure and interface direction that reflect the business and audience."),
        ("Website development", "Responsive front end implementation that brings an agreed design to life."),
        ("Business websites", "Multi page websites that explain services, build trust and make enquiry routes clear."),
        ("Landing pages", "Focused pages that give a specific offer the context and action it needs."),
        ("Website redesign", "A planned update to structure, content presentation and interface for an existing site."),
        ("UI and UX implementation", "Careful translation of interface designs into usable, responsive website behavior."),
    ]
    positions = [(38, 578), (315, 578), (38, 433), (315, 433), (38, 288), (315, 288)]
    for i, ((head, body), (x, yy)) in enumerate(zip(services, positions)):
        card(c, x, yy, 242, 126, head, body, f"0{i+1}")
    c.showPage()

    # 06 Industries
    y = page(c, 6, "Industries", "Different fields need", "different answers.", "These are target industries I can serve, not a list of past clients. Each project begins by understanding its own audience and business requirements.")
    industries = ["Real estate", "Construction", "Healthcare", "Restaurants", "Ecommerce", "Consulting", "Professional services", "Local businesses", "Creative businesses"]
    for i, name in enumerate(industries):
        row, col = divmod(i, 3)
        x = 38 + col * 180
        yy = y - row * 105
        c.setFillColor(PANEL)
        c.roundRect(x, yy - 75, 166, 73, 6, fill=1, stroke=0)
        c.setStrokeColor(LINE)
        c.roundRect(x, yy - 75, 166, 73, 6, fill=0, stroke=1)
        c.setFillColor(LIME if i % 2 == 0 else PINK)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 13, yy - 23, f"0{i+1}")
        c.setFillColor(PAPER)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x + 13, yy - 49, name)
    c.setFillColor(PANEL2)
    c.roundRect(38, 93, W - 76, 66, 6, fill=1, stroke=0)
    paragraph(c, "Industry context shapes the content, the page order and the questions visitors need answered.", 53, 132, W - 106, size=10, leading=14, color=PAPER)
    c.showPage()

    # 07 Process
    page(c, 7, "Working process", "Six stages.", "A clear handover.", "The process gives both sides a shared view of what is being decided, what is being built and what is ready for review.")
    steps = [
        ("Requirement understanding", "Discuss business goals, audience, content, scope and practical constraints."),
        ("Research and planning", "Gather context and set priorities before selecting a direction."),
        ("Website structure", "Plan the pages, navigation and information order."),
        ("Design and development", "Shape the interface and build the responsive front end."),
        ("Testing and optimization", "Review layouts, links and interactions, then improve the details."),
        ("Final delivery", "Prepare the finished website and provide a clear handover."),
    ]
    yy = 590
    for i, (head, body) in enumerate(steps):
        c.setFillColor(LIME if i in (0, 3) else PINK if i in (2, 5) else RED)
        c.circle(58, yy - 13, 14, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(58, yy - 16, f"{i+1:02d}")
        if i < len(steps) - 1:
            c.setStrokeColor(LINE)
            c.setLineWidth(2)
            c.line(58, yy - 28, 58, yy - 76)
        c.setFillColor(PAPER)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(91, yy - 9, head)
        paragraph(c, body, 91, yy - 28, W - 130, size=8.5, leading=12)
        yy -= 79
    c.showPage()

    # 08 Capabilities
    y = page(c, 8, "Development capabilities", "Structure makes", "the site easier to use.", "The capability is not only to place content on a page. It is to arrange the page so visitors can move through the information with less friction.")
    capabilities = [
        "Structured business websites",
        "Responsive page layouts",
        "Professional landing pages",
        "Multi page website structure",
        "Clear navigation systems",
        "User friendly interfaces",
        "Organized content structures",
    ]
    yy = y - 3
    for i, item in enumerate(capabilities):
        c.setStrokeColor(LINE)
        c.line(38, yy - 13, W - 38, yy - 13)
        c.setFillColor(LIME if i % 2 == 0 else PINK)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(45, yy - 1, f"{i+1:02d}")
        c.setFillColor(PAPER)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(86, yy - 2, item)
        yy -= 51
    c.setFillColor(PANEL2)
    c.roundRect(38, 103, W - 76, 92, 7, fill=1, stroke=0)
    label(c, "A useful website", 54, 168, LIME)
    paragraph(c, "helps visitors find the right information, understand the offer and know what to do next.", 54, 145, W - 108, size=11, leading=16, color=PAPER)
    c.showPage()

    # 09 Illustrative work
    page(c, 9, "Website presentation", "Illustrative website", "scenarios.", "These hypothetical examples demonstrate page structure and interface thinking. They are not completed client projects or live commercial work.")
    examples = [
        ("01", "Real estate website", "Property search, neighborhood context, agent information and a visible viewing enquiry route.", RED),
        ("02", "Consulting website", "A clear service offer, working approach, audience fit and a direct route to discuss a brief.", LIME),
        ("03", "Local restaurant website", "Menu highlights, location, opening information and a practical booking or contact action.", PINK),
    ]
    yy = 555
    for number, head, body, accent in examples:
        c.setFillColor(PANEL)
        c.roundRect(38, yy - 128, W - 76, 110, 7, fill=1, stroke=0)
        c.setFillColor(accent)
        c.rect(38, yy - 128, 5, 110, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(58, yy - 43, number)
        c.setFillColor(PAPER)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(96, yy - 43, head)
        paragraph(c, body, 96, yy - 66, W - 150, size=9, leading=13)
        yy -= 139
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(38, 102, "Sample structures only. No client names, results or completed work are claimed.")
    c.showPage()

    # 10 Why work with me
    y = page(c, 10, "Why work with me", "Direct communication.", "Connected execution.", "A straightforward working relationship helps keep the project clear from requirements through final delivery.")
    reasons = [
        ("Direct communication", "Work with the person planning and developing the website."),
        ("Business requirements first", "Use the business goal to guide structure and interface choices."),
        ("Attention to detail", "Review content, spacing, responsive behavior and working links."),
        ("Structured development", "Move through clear stages with review points and agreed outputs."),
        ("Usability in view", "Make the site easier to navigate and its next step easier to find."),
        ("Clear coordination", "Keep decisions, feedback and delivery understandable."),
    ]
    for i, (head, body) in enumerate(reasons):
        row, col = divmod(i, 2)
        x, yy = 38 + col * 278, 570 - row * 142
        card(c, x, yy, 242, 120, head, body, f"0{i+1}")
    c.showPage()

    # 11 FAQ
    page(c, 11, "Frequently asked questions", "Good to know", "before we start.", "A few useful details about the scope and how a new website project begins.")
    faqs = [
        ("What website services do you provide?", "Website design, front end development, business websites, landing pages, responsive implementation, redesign and UI implementation."),
        ("Which businesses can you work with?", "Founders and businesses across real estate, construction, healthcare, restaurants, ecommerce, consulting, professional services, local and creative fields."),
        ("Do you develop responsive websites?", "Yes. Responsive development is part of the page planning and implementation."),
        ("Can you build multi page websites?", "Yes. Page structure and navigation can be planned around the information your business needs to share."),
        ("Can you redesign an existing website?", "Yes. We can review the current structure, clarify the requirements and plan a more useful experience."),
        ("How do you approach a new project?", "We begin with requirements and audience, then plan, structure, design, develop, review and prepare delivery."),
        ("Which technologies do you use?", "My verified front end skills include HTML, CSS and JavaScript."),
        ("How can we discuss a project?", "Email a short description of your business, website needs and preferred next step."),
    ]
    yy = 583
    for i, (question, answer) in enumerate(faqs):
        label(c, f"Q{i+1:02d}", 38, yy, LIME if i % 2 == 0 else PINK)
        c.setFillColor(PAPER)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawString(82, yy, question)
        paragraph(c, answer, 82, yy - 17, W - 120, size=7.5, leading=10)
        yy -= 62
    c.showPage()

    # 12 Contact
    c.setFillColor(INK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.drawImage(ImageReader(str(PORTRAIT_DARK)), 0, 0, width=W, height=H)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(40, H - 42, "12 / CONTACT")
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 34)
    c.drawString(40, H - 105, "LET'S BUILD")
    c.setFillColor(RED)
    c.setFont("Helvetica-Oblique", 32)
    c.drawString(40, H - 143, "the right website.")
    paragraph(c, "If your business needs a clear, responsive website, send a short note about your audience, goals and project requirements.", 40, H - 188, 360, size=11, leading=17, color=PAPER)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(40, H - 270, "EMAIL")
    c.setFillColor(PAPER)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(40, H - 294, "kamaljaved78@gmail.com")
    c.setStrokeColor(LIME)
    c.line(40, H - 305, 290, H - 305)
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(40, H - 346, "LOCATION")
    c.setFillColor(PAPER)
    c.setFont("Helvetica", 11)
    c.drawString(40, H - 367, "Pakistan")
    c.setFillColor(LIME)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(40, H - 411, "PROJECT REGION")
    c.setFillColor(PAPER)
    c.setFont("Helvetica", 11)
    c.drawString(40, H - 432, "United States and United Kingdom")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(40, 57, "KAMAL JAVED  /  WEBSITE DESIGNER + DEVELOPER")
    c.setStrokeColor(LIME)
    c.rect(24, 24, W - 48, H - 48, fill=0, stroke=1)
    c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
