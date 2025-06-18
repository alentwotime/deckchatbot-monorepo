# 📸 DeckChatbot Vision Input Guide

To ensure accurate AI measurement and rendering, please follow these guidelines when uploading drawings or photos.

--

## 1️⃣ Required Uploads

### ✅ A. Graph Paper Sketch (Mandatory)
- Drawn **to scale** using graph paper
- All **outer measurements** labeled (in feet and inches)
- **Mark** the following clearly:
  - **Stairs** → arrow labeled "stairs"
  - **House Door** → box or line labeled "door"
  - **Deck Height** → upward arrow with height (e.g., 3' 6")

#### 🔧 Example Markup:
- 12' 3" x 14' 6"
- ↕️ 3' 6" (deck height)
- ↗️ (stairs)
- 📦 (door)

--

### ✅ B. Real Photos of Area (Optional but Recommended)
- Photo of the **back of the house** (where the deck is going)
- Any current deck condition (if resurfacing)
- Photos should:
  - Show the full **area or wall**
  - Be taken from a slight angle (for 3D overlay realism)
  - Avoid obstructions (cars, people, dogs, etc.)

--

## 2️⃣ Formats

| Type          | Format        | Max Size |
|---------------|---------------|----------|
| Drawings      | .JPG, .PNG, .PDF | 15MB     |
| Real Photos   | .JPG, .PNG    | 15MB     |

--

## 3️⃣ Tips for Accuracy

- Use natural daylight (avoid harsh shadows)
- Ensure graph paper edges are **fully visible**
- Avoid folds or tilted angles when photographing sketches
- Use black ink or dark pencil — no neon or faint markers

--

## 🧠 AI Process

1. **OCR** reads measurement labels
2. **Edge detection** outlines perimeter
3. **Classification** identifies features (stairs, doors, height)
4. **2D to 3D model conversion**
5. **Image overlay** (your photo + 3D render)

--

## ❓Need Help?

If you're unsure if your drawing is legible, upload it and the bot will tell you what’s missing before continuing.
🎨 Starter UI Flow for Image Upload (Frontend Concept)
For a Vue/React/HTML-based frontend, here's a basic flow:

plaintext
Copy
Edit
🧠 Bot: Welcome! Let's build your deck.

1. [Prompt] "Is this a new deck or a resurface?"
   → [User selects]

2. [Prompt] "Please upload a photo of the area (optional but helpful)."
   → 📤 File drag/drop or select

3. [Prompt] "Now upload your sketch or blueprint of the deck with measurements."
   → 📤 File upload required

4. [Bot Action] Analyzing your files...
   → Spinner, preview images, show OCR results live

5. [Prompt] "Where is the door located? Are there stairs?"
   → Interactive drawing tool (or click-to-mark from preview)

6. [AI Output]
   - ✅ 2D render preview
   - 📐 Detected measurements
   - 🔄 Edit? | Continue

7. [Final Output]
   - 🧊 3D render
   - 📷 Overlaid onto home photo
   - ✅ Export or save to CRM