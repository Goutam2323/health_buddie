const express = require("express");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/files");
const path = require("path");
const session = require("express-session");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const authRoutes = require("./routes/authRoutes");
const User = require("./models/user");
const { ensureAuthenticated } = require("./middleware/authMiddleware");
require("dotenv").config();

// Ensure the 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const app = express();
const port = process.env.PORT || 3000;
// Initialize Google Generative AI with your API key
const API_KEY = process.env.API_KEY; // Replace with your actual API key
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

// Generate a secure random secret key for sessions

const sessionSecret = crypto.randomBytes(32).toString("hex");

// Middleware to parse JSON and URL-encoded bodies
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Set up session middleware with a custom expiration time
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
      // Use 'new' here
      mongoUrl: process.env.DB_API,
      collectionName: "sessions",
    }),
    cookie: { maxAge: 180 * 60 * 1000 }, // Session cookie expires after 180 minutes (3 hours)
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "pdf_reports")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});
mongoose
  .connect(process.env.DB_API, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
async function getNextPatientIdFromDatabase(userId) {
  const user = await User.findById(userId);
  if (user) {
    const nextPatientId = user.patients.length + 1;
    return nextPatientId;
  }
  return 1;
}

// Route to get the next available patient ID
app.get("/getNextPatientId", ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id; // User ID from the authenticated session
    const nextPatientId = await getNextPatientIdFromDatabase(userId);
    res.json({ nextPatientId });
  } catch (error) {
    console.error("Error getting next patient ID:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the main HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// Endpoint to handle queries
app.post("/query", async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // Health-related prompt
const A_prompt = `You are a knowledgeable and compassionate medical expert, providing clear, concise, and accurate information about health, wellness, medicine, and the human body. Follow these guidelines:

1️⃣ Focus on Health Topics: Only answer questions related to health, wellness, the human body, medical conditions, symptoms, treatments, or diet. Do not respond to unrelated topics.

2️⃣ Clarity and Brevity: Provide short, straightforward answers using simple, non-technical language. Avoid unnecessary details and medical jargon.

3️⃣ Accuracy and Safety: Offer reliable and safe information. Avoid diagnoses or treatment plans, and always encourage consulting a healthcare professional.

4️⃣ Empathy and Tone: Maintain a friendly, empathetic tone while addressing sensitive health concerns.

5️⃣ Engaging Format: Use:

Bullet points
Numbered lists
Minimal emojis for clarity (e.g., ⚕️👍).
Headers or dividers for organization.
6️⃣ No Follow-Up Questions: Answer the query directly without asking follow-up questions.

Disclaimer: I am HealthBuddy. This information is for general guidance only and is not a substitute for professional medical consultation. Always consult a qualified healthcare provider for specific concerns.


Query: ${query}`;
    const Actual_result = await model.generateContent(A_prompt);
    const Actual_response = Actual_result.response;
    const Actual_text = Actual_response.text().trim();
    res.json({ response: Actual_text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Error generating content" });
  }
});

// Endpoint to retrieve the previous response
app.get("/previous", (req, res) => {
  res.json({ previous: req.session.previousResponse || "" }); // Return an empty string if no previous response
});

// Route to handle form data for diet plans
app.post("/diet-plan", async (req, res) => {
  console.log("Received form data:", req.body);

  const {
    Weight,
    Height,
    dietaryType,
    allergies,
    intolerances,
    healthConditions,
    activityLevel,
    goal,
    goalDetails,
  } = req.body;

  const prompt = `Generate a diet plan for a person with the following preferences and goals:
Weight_in_Kg: ${Weight}
Height_in_feet: ${Height}
Dietary Type: ${dietaryType}
Allergies: ${allergies}
Intolerances: ${intolerances}
Health Conditions: ${healthConditions}
Activity Level: ${activityLevel}
Goal: ${goal}
Goal Details: ${goalDetails}

Please provide a detailed diet plan meals for One week in the following format. Make sure each section ends with :** and includes meal descriptions:

Breakfast:**
Meal 1: [Detailed meal description]
Meal 2: [Detailed meal description]
Meal 3: [Detailed meal description]
Meal 4: [Detailed meal description]
Meal 5: [Detailed meal description]

Lunch:**
Meal 1: [Detailed meal description]
Meal 2: [Detailed meal description]
Meal 3: [Detailed meal description]
Meal 4: [Detailed meal description]
Meal 5: [Detailed meal description]

Dinner:**
Meal 1: [Detailed meal description]
Meal 2: [Detailed meal description]
Meal 3: [Detailed meal description]
Meal 4: [Detailed meal description]
Meal 5: [Detailed meal description]

Snacks:**
Snack 1: [Detailed snack description]
Snack 2: [Detailed snack description]
Snack 3: [Detailed snack description]
Snack 4: [Detailed snack description]
Snack 5: [Detailed snack description]

Hydration:**
Drink 1: [Detailed hydration information]
Drink 2: [Detailed hydration information]
Drink 3: [Detailed hydration information]

Macros:**
Protein: [Protein information]
Carbohydrates: [Carbohydrate information]
Fats: [Fat information]

Important Notes:**
Note 1: [Detailed note]
Note 2: [Detailed note]

Example:
Breakfast:**
Meal 1: Oatmeal with berries and nuts (1/2 cup rolled oats, 1/2 cup berries, 1/4 cup nuts)
Meal 2: 2 boiled eggs with a slice of whole-grain toast and avocado (2 eggs, 1 slice whole-grain toast, 1/4 avocado)
Meal 3: Greek yogurt with honey and granola (1 cup Greek yogurt, 1/4 cup granola, 1 tsp honey)
Meal 4: Smoothie with spinach, banana, and protein powder (1 cup spinach, 1 banana, 1 scoop protein powder, 1/2 cup almond milk)
Meal 5: Whole-grain pancakes with peanut butter and banana slices (2 pancakes, 1 tbsp peanut butter, 1/2 banana)

Ensure the response strictly follows this format with section headers ending in :** and clear meal descriptions.

  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const dietPlanText = await response.text(); // Parse the response into a structured object
    console.log(dietPlanText);
    const structuredDietPlan = {};
    let currentSection = "";
    const lines = dietPlanText.split("\n");
    lines.forEach((line) => {
      if (line.trim().endsWith(":**")) {
        currentSection = line.trim().slice(0, -2);
        structuredDietPlan[currentSection] = [];
      } else if (currentSection) {
        // Remove ALL "*" characters from the line
        const mealText = line.trim().replace(/\*/g, ""); // Use global flag 'g'
        structuredDietPlan[currentSection].push(mealText.trim());
      }
    });

    // Send the structured diet plan back to the client
    res.json({ dietPlan: structuredDietPlan });
  } catch (error) {
    console.error("Error generating diet plan:", error);
    res.status(500).json({ error: "Error generating diet plan" });
  }
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Folder where uploaded files will be placed
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

// Create Multer instance
const upload = multer({ storage: storage });

// Route for handling image uploads and sending to Gemini API
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Upload the image using the File API
    const uploadResult = await fileManager.uploadFile(file.path, {
      mimeType: file.mimetype,
      displayName: file.originalname,
    });

    // Get the file URI from the upload result
    const fileUri = uploadResult.file.uri;

    // Create the prompt using the file URI
    const prompt = [
      {
        fileData: {
          mimeType: file.mimetype,
          fileUri: fileUri,
        },
      },
      {
        text: `if the image is not a medical report then generate "My duty is to only analyze medical reports."
           else You are an intelligent assistant that analyzes reports and extracts specific personal information to use in a detailed analysis. Analyze the health report and provide a summary of the findings, formatted with subheadings. Include the normal range for each attribute based on the patient's age and gender.adjust the normal range according to your  health knowlwdge based on the patient's age and gender. For each test, list the attributes, their actual values, according to that normal range, categorize them as Healthy, Dietary Attention, or Medical Attention. If a category is Dietary Attention or Medical Attention, provide the reason including why it is a problem and possible causes.
 note:Please follow this exact format in your response:
           Example Output:
           ## Personal Information:
           Name: Extracted Name
           Age: Extracted Age
           Gender: Extracted Gender

           ## Test: Bloodwork
           * Attribute: Hemoglobin
           * Actual Value: 12.5 g/dL
           * Normal Range: 13.5-17.5 g/dL (for men aged 19)
           * Category: Medical Attention
           * Reason: Hemoglobin is below the normal range. Low hemoglobin can indicate anemia. Potential causes include iron deficiency, vitamin deficiency, blood loss, or underlying medical conditions.

           * Attribute: Cholesterol
           * Actual Value: 250 mg/dL
           * Normal Range: <100 mg/dL (for men aged 19)
           * Category: Dietary Attention
           * Reason: Cholesterol is elevated. High cholesterol can lead to atherosclerosis and other cardiovascular issues.

           ## Test: Blood Pressure
           * Attribute: Systolic
           * Actual Value: 130 mmHg
           * Normal Range: 90-120 mmHg (for men aged 19)
           * Category: Medical Attention
           * Reason: Systolic blood pressure is elevated. Elevated blood pressure can increase the risk of heart disease and stroke.

           ... (Continue with other tests and attributes)

           ## Summary:
           This summary should highlight the main findings, particularly any attributes that fall under Dietary Attention or Medical Attention categories, and recommend consulting a healthcare professional if necessary.
         `,
      },
    ];

    // Generate content using the prompt
    const result = await model.generateContent(prompt);
    // Extract the text content from the response
    let generatedText = "";
    if (result.response.candidates && result.response.candidates.length > 0) {
      const candidate = result.response.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        generatedText = candidate.content.parts[0].text;
      }
    }

    // Log the extracted text for debugging
    console.log("Generated text:", generatedText);

    // Check if generatedText is undefined and handle accordingly
    if (!generatedText) {
      throw new Error(
        "Generated text is undefined. Check API response structure."
      );
    }
    if (generatedText.includes("My duty is to only analyze medical reports.")) {
      return res.json({
        message: "Non-medical report uploaded",
        generativeAIResponse: generatedText,
      });
    }

    const structuredReport = {};
    let currentSection = null;
    let currentAttribute = null;
    const lines = generatedText.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Handle Section Headers
      if (trimmedLine.startsWith("## Test:")) {
        currentSection = trimmedLine.replace("##", "").trim();
        structuredReport[currentSection] = [];
      } else if (trimmedLine.startsWith("## Personal Information:")) {
        currentSection = "Personal Information";
        structuredReport[currentSection] = {};
      } else if (currentSection === "Personal Information") {
        const parts = trimmedLine.replace("*", "").split(":");
        if (parts.length === 2) {
          structuredReport[currentSection][parts[0].trim()] = parts[1].trim();
        }
      } else if (currentSection) {
        // Handle Attributes, Values, Categories, and Reasons
        if (trimmedLine.startsWith("* Attribute:")) {
          currentAttribute = trimmedLine.replace("* Attribute:", "").trim();
          structuredReport[currentSection].push({
            attribute: currentAttribute,
            actualValue: "",
            normalRange: "",
            category: "",
            reason: "",
          });
        } else if (currentAttribute) {
          if (trimmedLine.startsWith("* Actual Value:")) {
            const value = trimmedLine.replace("* Actual Value:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].actualValue = value;
          } else if (trimmedLine.startsWith("* Normal Range:")) {
            const range = trimmedLine.replace("* Normal Range:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].normalRange = range;
          } else if (trimmedLine.startsWith("* Category:")) {
            const category = trimmedLine.replace("* Category:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].category = category;
          } else if (trimmedLine.startsWith("* Reason:")) {
            const reason = trimmedLine.replace("* Reason:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].reason = reason;
          }
        }
      }
    });

    // Handle Summary (Separately)
    if (generatedText.includes("## Summary:")) {
      const summaryLines = generatedText
        .split("## Summary:")[1]
        .trim()
        .split("\n");
      structuredReport["Summary"] = summaryLines.join(" "); // Join the summary lines into a single string
    }

    // Send the response back to the client
    res.json({
      message: "Image uploaded and processed by Google Generative AI",
      generativeAIResponse: structuredReport,
    });
  } catch (error) {
    console.error("Error uploading image or generating content:", error);
    res.status(500).send("Error processing image.");
  }
});

// Route to handle form data
app.post("/upload-form-data", async (req, res) => {
  try {
    const { name, age, gender, reportType, reportValues } = req.body;

    // Construct the prompt on the server
    const prompt = [
      {
        text: `## Personal Information:\nName: ${name}\nAge: ${age}\nGender: ${gender}`,
      },
      {
        text: `## Test: ${reportType}`,
      },
    ];

    // Add report values to the prompt
    for (const key in reportValues) {
      const value = reportValues[key];
      prompt.push({
        text: `* Attribute: ${key.replace("_", " ")}\n* Actual Value: ${value}`,
      });
    }

    // Append the generic prompt part
    prompt.push({
      text: `if some attributes does not have actual value than assume that it has normal value for that value according to its age and gender and start analyze
         else You are an intelligent assistant that analyzes reports and extracts specific personal information to use in a detailed analysis. Analyze the health report and provide a summary of the findings, formatted with subheadings. Include the normal range for each attribute based on the patient's age and gender.adjust the normal range according to your  health knowlwdge based on the patient's age and gender. For each test, list the attributes, their actual values, according to that normal range, categorize them as Healthy, Dietary Attention, or Medical Attention. If a category is Dietary Attention or Medical Attention, provide the reason including why it is a problem and possible causes.
 note:Please follow this exact format in your response:
         Example Output:
         ## Personal Information:
         Name: Extracted Name
         Age: Extracted Age
         Gender: Extracted Gender

         ## Test: Bloodwork
         * Attribute: Hemoglobin
         * Actual Value: 12.5 g/dL
         * Normal Range: 13.5-17.5 g/dL (for men aged 19)
         * Category: Medical Attention
         * Reason: Hemoglobin is below the normal range. Low hemoglobin can indicate anemia. Potential causes include iron deficiency, vitamin deficiency, blood loss, or underlying medical conditions.

         * Attribute: Cholesterol
         * Actual Value: 250 mg/dL
         * Normal Range: <100 mg/dL (for men aged 19)
         * Category: Dietary Attention
         * Reason: Cholesterol is elevated. High cholesterol can lead to atherosclerosis and other cardiovascular issues.

         ## Test: Blood Pressure
         * Attribute: Systolic
         * Actual Value: 130 mmHg
         * Normal Range: 90-120 mmHg (for men aged 19)
         * Category: Medical Attention
         * Reason: Systolic blood pressure is elevated. Elevated blood pressure can increase the risk of heart disease and stroke.

         ... (Continue with other tests and attributes)

         ## Summary:
         This summary should highlight the main findings, particularly any attributes that fall under Dietary Attention or Medical Attention categories, and recommend consulting a healthcare professional if necessary.
       `,
    });

    // Generate content using the prompt
    const result = await model.generateContent(prompt);
    // Extract the text content from the response
    let generatedText = "";
    if (result.response.candidates && result.response.candidates.length > 0) {
      const candidate = result.response.candidates[0];
      if (
        candidate.content &&
        candidate.content.parts &&
        candidate.content.parts.length > 0
      ) {
        generatedText = candidate.content.parts[0].text;
      }
    }

    // Log the extracted text for debugging
    console.log("Generated text:", generatedText);

    // Check if generatedText is undefined and handle accordingly
    if (!generatedText) {
      throw new Error(
        "Generated text is undefined. Check API response structure."
      );
    }
    if (generatedText.includes("My duty is to only analyze medical reports.")) {
      return res.json({
        message: "Non-medical report uploaded",
        generativeAIResponse: generatedText,
      });
    }

    const structuredReport = {};
    let currentSection = null;
    let currentAttribute = null;
    const lines = generatedText.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Handle Section Headers
      if (trimmedLine.startsWith("## Test:")) {
        currentSection = trimmedLine.replace("##", "").trim();
        structuredReport[currentSection] = [];
      } else if (trimmedLine.startsWith("## Personal Information:")) {
        currentSection = "Personal Information";
        structuredReport[currentSection] = {};
      } else if (currentSection === "Personal Information") {
        const parts = trimmedLine.replace("*", "").split(":");
        if (parts.length === 2) {
          structuredReport[currentSection][parts[0].trim()] = parts[1].trim();
        }
      } else if (currentSection) {
        // Handle Attributes, Values, Categories, and Reasons
        if (trimmedLine.startsWith("* Attribute:")) {
          currentAttribute = trimmedLine.replace("* Attribute:", "").trim();
          structuredReport[currentSection].push({
            attribute: currentAttribute,
            actualValue: "",
            normalRange: "",
            category: "",
            reason: "",
          });
        } else if (currentAttribute) {
          if (trimmedLine.startsWith("* Actual Value:")) {
            const value = trimmedLine.replace("* Actual Value:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].actualValue = value;
          } else if (trimmedLine.startsWith("* Normal Range:")) {
            const range = trimmedLine.replace("* Normal Range:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].normalRange = range;
          } else if (trimmedLine.startsWith("* Category:")) {
            const category = trimmedLine.replace("* Category:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].category = category;
          } else if (trimmedLine.startsWith("* Reason:")) {
            const reason = trimmedLine.replace("* Reason:", "").trim();
            structuredReport[currentSection][
              structuredReport[currentSection].length - 1
            ].reason = reason;
          }
        }
      }
    });

    // Handle Summary (Separately)
    if (generatedText.includes("## Summary:")) {
      const summaryLines = generatedText
        .split("## Summary:")[1]
        .trim()
        .split("\n");
      structuredReport["Summary"] = summaryLines.join(" "); // Join the summary lines into a single string
    }

    // Send the response back to the client
    res.json({
      message: "prompt uploaded and processed by Google Generative AI",
      generativeAIResponse: structuredReport,
    });
  } catch (error) {
    console.error("Error generating content from form data:", error);
    res.status(500).send("Error processing form data.");
  }
});
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
