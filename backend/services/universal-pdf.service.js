const puppeteer = require("puppeteer");
const puppeteerCore = require("puppeteer-core");
const path = require("path");
const fs = require("fs").promises;
const logger = require("../utils/logger");
const { v4: uuidv4 } = require("uuid");

// Import Chromium for serverless environments
let chromium;
let chromiumError;
try {
  chromium = require("@sparticuz/chromium");
  logger.info("✅ @sparticuz/chromium imported successfully");
} catch (error) {
  chromiumError = error;
  logger.warn("❌ Failed to import @sparticuz/chromium:", {
    error: error.message,
    code: error.code,
    stack: error.stack?.substring(0, 200),
  });
}

class UniversalPDFService {
  constructor() {
    this.browser = null;
    this.templatesPath = path.join(__dirname, "../templates/pdf");
  }

  // Helper method to check chromium availability
  async checkChromiumAvailability() {
    const isServerless =
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (!isServerless) {
      return {
        available: true,
        reason: "Not needed in non-serverless environment",
      };
    }

    if (!chromium) {
      // Try to require it again in case of lazy loading issues
      try {
        const runtimeChromium = require("@sparticuz/chromium");
        logger.info("✅ Chromium loaded successfully at runtime");
        return { available: true, chromium: runtimeChromium };
      } catch (error) {
        logger.error(
          "❌ Chromium still not available at runtime:",
          error.message
        );
        return {
          available: false,
          error: error.message,
          code: error.code,
          suggestions: [
            "Ensure @sparticuz/chromium is in dependencies, not devDependencies",
            "Check if package was installed correctly during deployment",
            "Verify Vercel build logs for any npm install errors",
          ],
        };
      }
    }

    return { available: true, chromium };
  }

  async initializeBrowser() {
    if (!this.browser || !this.browser.isConnected()) {
      try {
        const isServerless =
          process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

        // Check chromium availability in serverless environments
        if (isServerless) {
          const chromiumCheck = await this.checkChromiumAvailability();
          if (!chromiumCheck.available) {
            logger.error(
              "❌ Chromium availability check failed:",
              chromiumCheck
            );
            throw new Error(
              `Chromium not available: ${
                chromiumCheck.error
              }. Suggestions: ${chromiumCheck.suggestions.join(", ")}`
            );
          }
          if (chromiumCheck.chromium && !chromium) {
            chromium = chromiumCheck.chromium;
          }
        }

        const baseArgs = [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--font-render-hinting=none",
          "--disable-features=VizDisplayCompositor",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ];

        const serverlessArgs = [
          "--single-process",
          "--disable-extensions",
          "--disable-plugins",
          "--memory-pressure-off",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--metrics-recording-only",
          "--mute-audio",
          "--safebrowsing-disable-auto-update",
          "--disable-component-update",
          "--disable-ipc-flooding-protection",
          "--max_old_space_size=1024", // Limit memory usage
        ];

        let browserOptions = {
          headless: "new",
          args: isServerless ? [...baseArgs, ...serverlessArgs] : baseArgs,
          defaultViewport: isServerless
            ? {
                width: 1024,
                height: 768,
                deviceScaleFactor: 1,
              }
            : {
                width: 1920,
                height: 1080,
                deviceScaleFactor: 2,
              },
          timeout: isServerless ? 15000 : 30000,
          protocolTimeout: isServerless ? 15000 : 30000,
        };

        // Additional serverless optimizations
        if (isServerless) {
          browserOptions.dumpio = false; // Reduce logging
          browserOptions.pipe = false; // Reduce IPC overhead
        }

        // Use serverless Chromium if available and in serverless environment
        if (isServerless && chromium) {
          logger.info("🌐 Using serverless Chromium for PDF generation...");

          try {
            // Prepare Chromium for serverless (with error handling)
            await chromium
              .font("https://fonts.gstatic.com/s/noto/v8/NotoColorEmoji.ttf")
              .catch((fontError) => {
                logger.warn(
                  "Font loading failed, continuing without custom fonts:",
                  fontError.message
                );
              });

            browserOptions.executablePath = await chromium.executablePath();
            browserOptions.args = [...chromium.args, ...browserOptions.args];

            logger.info(
              "🚀 Launching PDF browser with serverless Chromium...",
              {
                isServerless,
                hasChromium: !!chromium,
                executablePath: browserOptions.executablePath
                  ? "✅ Available"
                  : "❌ Missing",
                argsCount: browserOptions.args.length,
                timeout: browserOptions.timeout,
              }
            );

            this.browser = await puppeteerCore.launch(browserOptions);
          } catch (chromiumError) {
            logger.error(
              "❌ Serverless Chromium failed, falling back to regular Puppeteer:",
              chromiumError.message
            );
            // Fallback to regular puppeteer
            browserOptions.executablePath = undefined; // Remove custom executable
            this.browser = await puppeteer.launch(browserOptions);
          }
        } else if (isServerless) {
          logger.warn(
            "⚠️ Serverless environment detected but Chromium not available, using regular Puppeteer"
          );
          this.browser = await puppeteer.launch(browserOptions);
        } else {
          logger.info("🚀 Launching PDF browser with regular Puppeteer...", {
            isServerless,
            hasChromium: !!chromium,
            argsCount: browserOptions.args.length,
            timeout: browserOptions.timeout,
          });

          this.browser = await puppeteer.launch(browserOptions);
        }

        // Test browser health
        const version = await this.browser.version();
        logger.info("✅ Universal PDF Service initialized successfully", {
          version: version.substring(0, 50),
          isServerless,
          usingServerlessChromium: isServerless && !!chromium,
          pid: this.browser.process()?.pid,
        });
      } catch (error) {
        logger.error("❌ Failed to initialize PDF browser:", {
          message: error.message,
          stack: error.stack?.substring(0, 500),
          isServerless:
            process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
          hasChromium: !!chromium,
        });

        // Provide more specific error messages
        if (process.env.VERCEL) {
          if (!chromium) {
            const errorDetails = chromiumError
              ? `Import failed: ${chromiumError.message} (${chromiumError.code})`
              : "Package not found or not installed";
            throw new Error(
              `PDF service requires @sparticuz/chromium package for Vercel deployment. ${errorDetails}`
            );
          } else {
            throw new Error(
              `PDF service failed to initialize in Vercel: ${error.message}`
            );
          }
        } else {
          throw new Error(
            `PDF service initialization failed: ${error.message}`
          );
        }
      }
    }
    return this.browser;
  }

  async generatePDF(contentType, data, options = {}) {
    const isServerless =
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    // In serverless environments, use reduced settings for better reliability
    const serverlessOptions = {
      timeout: 20000, // Increased timeout for Chromium initialization
      viewport: {
        width: 1024,
        height: 768,
        deviceScaleFactor: 1, // Reduced DPI for performance
      },
      pdfOptions: {
        format: "A4",
        printBackground: true,
        scale: 0.9, // Better scale for readability
        margin: {
          top: "15mm",
          right: "12mm",
          bottom: "15mm",
          left: "12mm",
        },
        displayHeaderFooter: false,
        preferCSSPageSize: false,
        // Serverless-specific optimizations
        omitBackground: false,
        tagged: false, // Disable accessibility tags for performance
      },
    };

    const browser = await this.initializeBrowser();
    let page = null;

    try {
      logger.info(`🔄 Generating PDF for content type: ${contentType}`, {
        isServerless,
        useReducedSettings: isServerless,
      });

      page = await browser.newPage();

      // Set viewport based on environment
      const viewport = isServerless
        ? serverlessOptions.viewport
        : {
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2,
          };

      await page.setViewport(viewport);

      // Set shorter timeout for serverless
      if (isServerless) {
        page.setDefaultTimeout(serverlessOptions.timeout);
        page.setDefaultNavigationTimeout(serverlessOptions.timeout);
      }

      // Load CSS fonts and styles
      try {
        await page.addStyleTag({
          content: await this.getUniversalStyles(),
        });
      } catch (styleError) {
        logger.warn(
          "Failed to load custom styles, continuing with default styles:",
          styleError.message
        );
      }

      // Generate HTML based on content type
      const html = await this.generateHTML(contentType, data);

      // Set content with appropriate wait condition
      const waitCondition = isServerless ? "domcontentloaded" : "networkidle0";
      const timeout = isServerless ? serverlessOptions.timeout : 30000;

      await page.setContent(html, {
        waitUntil: waitCondition,
        timeout: timeout,
      });

      // Add small delay to ensure content is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate PDF with environment-appropriate settings
      const pdfOptions = isServerless
        ? { ...serverlessOptions.pdfOptions, ...options }
        : {
            format: "A4",
            printBackground: true,
            scale: 1,
            margin: {
              top: "20mm",
              right: "15mm",
              bottom: "20mm",
              left: "15mm",
            },
            displayHeaderFooter: false,
            preferCSSPageSize: false,
            ...options,
          };

      const pdfData = await page.pdf(pdfOptions);

      // Convert Uint8Array to Node.js Buffer for proper handling
      const pdfBuffer = Buffer.from(pdfData);

      logger.info(`✅ PDF generated successfully for ${contentType}`, {
        size: pdfBuffer.length,
        isServerless,
        usedReducedSettings: isServerless,
      });
      return pdfBuffer;
    } catch (error) {
      logger.error(`❌ PDF generation failed for ${contentType}:`, {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        isServerless,
        contentType,
      });

      // Provide more specific error messages
      if (error.message.includes("timeout")) {
        throw new Error(
          `PDF generation timeout - content too complex for current environment`
        );
      } else if (error.message.includes("Navigation")) {
        throw new Error(`PDF generation failed - unable to load content`);
      } else if (error.message.includes("Protocol error")) {
        throw new Error(`PDF generation failed - browser communication error`);
      } else {
        throw new Error(`PDF generation failed: ${error.message}`);
      }
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          logger.warn("Error closing PDF page:", closeError.message);
        }
      }
    }
  }

  async generateHTML(contentType, data) {
    switch (contentType) {
      case "article":
        return this.generateArticleHTML(data);
      case "child-profile":
        return this.generateChildProfileHTML(data);
      case "dashboard-progress":
        return this.generateDashboardProgressHTML(data);
      case "assessment-report":
        return await this.generateAssessmentReportHTML(data);
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  // Get the logo image as base64 for embedding in PDF
  async getLogoBase64() {
    try {
      // Use the GitHub raw URL for the logo instead of local file path
      const logoUrl =
        "https://raw.githubusercontent.com/cognikidz/assets/main/LOGO.png";

      // For PDF generation, we'll use a fallback approach since we can't easily fetch external images
      // in the PDF generation context. We'll return null and handle it gracefully in the templates.
      logger.info("Using external logo URL for PDF generation");
      return logoUrl;
    } catch (error) {
      logger.warn("Could not load logo file, using fallback");
      return null;
    }
  }

  async generateArticleHTML(data) {
    const {
      title = "Article",
      content = "",
      author = { name: "Anonymous" },
      createdAt,
      category = "General",
      tags = [],
      excerpt = "",
      bannerUrl,
    } = data;

    // Get logo as base64 for embedding
    const logoBase64 = await this.getLogoBase64();

    const formatDate = (date) => {
      if (!date) return new Date().toLocaleDateString();
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    // Clean and format content for PDF
    const cleanContent = content
      .replace(/<script[^>]*>.*?<\/script>/gis, "") // Remove scripts
      .replace(/<style[^>]*>.*?<\/style>/gis, "") // Remove styles
      .replace(/<img[^>]*>/gi, "") // Remove images for now (can be enhanced later)
      .replace(
        /<a[^>]*>/gi,
        '<span style="color: #3b82f6; text-decoration: underline;">'
      )
      .replace(/<\/a>/gi, "</span>");

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title} - CogniKidz Article</title>
          <style>
              ${await this.getUniversalStyles()}
          </style>
      </head>
      <body>
          <div class="article-container">
                              <!-- Header -->
                <div class="section" style="text-align: center; border-bottom: 2px solid #6366F1; padding-bottom: 20px; margin-bottom: 30px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
                        <span style="color: white; font-size: 16px; font-weight: bold;">C</span>
                    </div>
                    <h1 style="color: #6366F1; font-size: 24px; margin-bottom: 5px;">CogniKidz</h1>
                    <p style="color: #64748B; font-size: 12px; margin: 0;">Professional Child Development Platform</p>
                </div>

              <!-- Article Header -->
              <div class="section keep-together">
                  <div style="background: #F8FAFC; border-left: 4px solid #6366F1; padding: 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                      <h1 style="color: #1E293B; font-size: 28px; font-weight: 700; margin-bottom: 15px; line-height: 1.2;">${title}</h1>
                      
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                          <div>
                              <p style="margin: 0; color: #64748B;"><strong>Author:</strong> ${
                                author.name || "Anonymous"
                              }</p>
                              <p style="margin: 0; color: #64748B;"><strong>Published:</strong> ${formatDate(
                                createdAt
                              )}</p>
                          </div>
                          <div>
                              <p style="margin: 0; color: #64748B;"><strong>Category:</strong> ${category}</p>
                              ${
                                tags.length > 0
                                  ? `<p style="margin: 0; color: #4b5563;"><strong>Tags:</strong> ${tags.join(
                                      ", "
                                    )}</p>`
                                  : ""
                              }
                          </div>
                      </div>

                      ${
                        excerpt
                          ? `
                      <div style="background: #e0f2fe; padding: 15px; border-radius: 6px; border-left: 3px solid #0284c7;">
                          <p style="margin: 0; font-style: italic; color: #0f172a; font-size: 14px;"><strong>Summary:</strong> ${excerpt}</p>
                      </div>
                      `
                          : ""
                      }
                  </div>
              </div>

              <!-- Article Content -->
              <div class="section-large">
                  <div style="font-size: 13px; line-height: 1.7; color: #374151;">
                      ${cleanContent}
                  </div>
              </div>

              <!-- Footer -->
              <div class="section" style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
                  <p style="color: #6b7280; font-size: 11px; margin-bottom: 5px;">
                      <strong>CogniKidz</strong> - Empowering Parents, Supporting Children
                  </p>
                  <p style="color: #9ca3af; font-size: 10px; margin: 0;">
                      Visit us at cognikidz.com for more resources and expert guidance
                  </p>
              </div>

              <!-- Disclaimer -->
              <div class="section" style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-top: 20px;">
                  <h4 style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Disclaimer</h4>
                  <p style="font-size: 10px; color: #6b7280; line-height: 1.4; margin: 0;">
                      This article is for informational and educational purposes only. It is not intended to replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals regarding your child's development and well-being.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  async generateAssessmentReportHTML(data) {
    const {
      childName = "Child",
      childAge,
      childGender,
      assessmentType = "Assessment",
      assessmentDate,
      riskScore,
      summary = "",
      recommendations = [],
      domainScores = [],
      aiReport = {},
      assessmentCategory,
      aiAnalysis = {},
      responses = [],
      totalQuestions = 0,
      correctAnswers = 0,
      accuracyRate,
      averageResponseTime,
    } = data;

    // Get logo as base64 for embedding
    const logoBase64 = await this.getLogoBase64();

    const formatDate = (date) => {
      if (!date) return new Date().toLocaleDateString();
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const getRiskColor = (score) => {
      if (!score || isNaN(score)) return "#6b7280";
      if (score <= 3) return "#10b981";
      if (score <= 7) return "#f59e0b";
      return "#ef4444";
    };

    const getRiskLevelText = (score) => {
      if (!score || isNaN(score)) return "Assessment Complete";
      if (score <= 3) return "Low Risk";
      if (score <= 7) return "Moderate Risk";
      return "High Risk";
    };

    const getRiskIcon = (score) => {
      if (!score || isNaN(score)) return "✅";
      if (score <= 3) return "✅";
      if (score <= 7) return "⚠️";
      return "🚨";
    };

    const isImageAssessment = assessmentCategory === "image";
    const childProfileImage = this.getChildAvatarByGender(childGender);

    // Parse summary sections if it's markdown format
    const parseSummaryContent = (summaryText) => {
      if (!summaryText)
        return {
          overview: "",
          strengths: [],
          challenges: [],
          recommendations: [],
          nextSteps: [],
        };

      const sections = {
        overview: "",
        strengths: [],
        challenges: [],
        recommendations: [],
        nextSteps: [],
      };

      // Try to extract structured content from markdown
      const lines = summaryText.split("\n").filter((line) => line.trim());
      let currentSection = "overview";
      let overviewLines = [];

      for (const line of lines) {
        const trimmed = line.trim();

        if (
          trimmed.startsWith("## Strengths") ||
          trimmed.toLowerCase().includes("strengths")
        ) {
          currentSection = "strengths";
          continue;
        } else if (
          trimmed.startsWith("## Challenges") ||
          trimmed.toLowerCase().includes("challenges")
        ) {
          currentSection = "challenges";
          continue;
        } else if (
          trimmed.startsWith("## Recommendations") ||
          trimmed.toLowerCase().includes("recommendations")
        ) {
          currentSection = "recommendations";
          continue;
        } else if (
          trimmed.startsWith("## Next Steps") ||
          trimmed.toLowerCase().includes("next steps")
        ) {
          currentSection = "nextSteps";
          continue;
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const content = trimmed.replace(/^[-•]\s*/, "");
          if (content) {
            sections[currentSection].push(content);
          }
        } else if (
          currentSection === "overview" &&
          trimmed &&
          !trimmed.startsWith("#")
        ) {
          overviewLines.push(trimmed);
        }
      }

      sections.overview = overviewLines.join(" ").replace(/\s+/g, " ").trim();
      return sections;
    };

    const summaryContent = parseSummaryContent(summary);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Assessment Report - ${childName}</title>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.5;
              color: #1f2937;
              font-size: 12px;
            }
            .page {
              min-height: calc(100vh - 40mm);
              padding: 25px;
              box-sizing: border-box;
              page-break-after: always;
            }
            .page:last-child {
              page-break-after: avoid;
            }
            .section {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 16px;
              orphans: 3;
              widows: 3;
            }
            .section-large {
              page-break-before: auto;
              break-before: auto;
              margin-bottom: 16px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .section-compact {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 12px;
              orphans: 2;
              widows: 2;
            }
            .keep-together {
              page-break-inside: avoid;
              break-inside: avoid;
              orphans: 3;
              widows: 3;
            }
            h1 { 
              font-size: 24px; 
              font-weight: 700; 
              margin-bottom: 12px; 
              line-height: 1.2;
            }
            h2 { 
              font-size: 18px; 
              font-weight: 600; 
              margin-bottom: 10px; 
              line-height: 1.3;
            }
            h3 { 
              font-size: 16px; 
              font-weight: 600; 
              margin-bottom: 8px; 
              line-height: 1.4;
            }
            p {
              margin-bottom: 8px;
              line-height: 1.5;
              font-size: 12px;
            }
            .compact-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
              gap: 12px;
            }
            .logo-container img {
              max-width: 120px;
              height: auto;
            }
          </style>
      </head>
      <body>
          <!-- Page 1: Cover Page -->
          <div class="page">
              <!-- Header with Logo -->
              <div class="section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #3b82f6;">
                  <div style="display: flex; align-items: center;">
                      <div class="logo-container" style="margin-right: 16px;">
                          <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                              <span style="color: white; font-size: 20px; font-weight: bold;">C</span>
                          </div>
                      </div>
                      <div>
                          <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #1f2937;">CogniKidz</h1>
                          <p style="margin: 0; color: #6b7280; font-size: 11px;">Professional Assessment Platform</p>
                      </div>
                  </div>
                  <div style="text-align: right; color: #6b7280; font-size: 10px;">
                      <div>Report Generated: ${formatDate(new Date())}</div>
                      <div>Assessment ID: ${data.id || "N/A"}</div>
                  </div>
              </div>

              <!-- Main Title -->
              <div class="section" style="text-align: center; margin: 30px 0;">
                  <h1 style="font-size: 24px; font-weight: 800; color: #1f2937; margin-bottom: 10px; letter-spacing: -0.02em;">
                      Assessment Report
                  </h1>
                  <div style="width: 60px; height: 3px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); margin: 0 auto 12px;"></div>
                  <p style="font-size: 14px; color: #6b7280; margin: 0;">
                      ${
                        isImageAssessment
                          ? "Interactive Image-Based Assessment"
                          : "Comprehensive Developmental Assessment"
                      }
                  </p>
                  <p style="font-size: 12px; color: #9ca3af; margin-top: 4px;">
                      ${assessmentType.toUpperCase()} Evaluation
                  </p>
              </div>

              <!-- Child Profile Section -->
              <div class="section" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 25px; margin: 25px 0; border: 1px solid #bfdbfe;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                      <div style="flex: 1;">
                          <h2 style="font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 16px;">Child Profile</h2>
                          
                          <div class="compact-grid">
                              <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                  <label style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Full Name</label>
                                  <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 2px;">${childName}</div>
                              </div>
                              
                              <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                  <label style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Age</label>
                                  <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 2px;">${
                                    childAge
                                      ? `${childAge} years old`
                                      : "Not specified"
                                  }</div>
                              </div>
                              
                              <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                  <label style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Gender</label>
                                  <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 2px;">${
                                    childGender
                                      ? childGender.charAt(0).toUpperCase() +
                                        childGender.slice(1)
                                      : "Not specified"
                                  }</div>
                              </div>
                              
                              <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                  <label style="font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Assessment Date</label>
                                  <div style="font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 2px;">${formatDate(
                                    assessmentDate
                                  )}</div>
                              </div>
                          </div>
                      </div>
                      
                      <!-- Child Avatar -->
                      <div style="margin-left: 25px; text-align: center;">
                          <div style="width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                              <span style="font-size: 28px;">${childProfileImage}</span>
                          </div>
                          <p style="margin-top: 8px; font-size: 11px; color: #6b7280;">Profile Avatar</p>
                      </div>
                  </div>
              </div>

              <!-- Assessment Overview -->
              <div class="section" style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <h2 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 15px; display: flex; align-items: center;">
                      <span style="background: #eff6ff; color: #2563eb; padding: 6px; border-radius: 6px; margin-right: 8px; font-size: 14px;">📊</span>
                      Assessment Overview
                  </h2>
                  
                  <div class="stats-grid">
                      ${
                        isImageAssessment
                          ? `
                      <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                          <div style="font-size: 20px; font-weight: 700; color: #166534;">${totalQuestions}</div>
                          <div style="font-size: 11px; color: #166534; margin-top: 2px;">Total Questions</div>
                      </div>
                      <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 8px; border: 1px solid #fde047;">
                          <div style="font-size: 20px; font-weight: 700; color: #a16207;">${correctAnswers}</div>
                          <div style="font-size: 11px; color: #a16207; margin-top: 2px;">Correct Answers</div>
                      </div>
                      <div style="text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #7dd3fc;">
                          <div style="font-size: 20px; font-weight: 700; color: #0369a1;">${
                            accuracyRate ? Math.round(accuracyRate) : "N/A"
                          }%</div>
                          <div style="font-size: 11px; color: #0369a1; margin-top: 2px;">Accuracy Rate</div>
                      </div>
                      `
                          : `
                      <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                          <div style="font-size: 20px; font-weight: 700; color: #166534;">${responses.length}</div>
                          <div style="font-size: 11px; color: #166534; margin-top: 2px;">Questions Answered</div>
                      </div>
                      <div style="text-align: center; padding: 15px; background: #fefce8; border-radius: 8px; border: 1px solid #fde047;">
                          <div style="font-size: 20px; font-weight: 700; color: #a16207;">${assessmentType}</div>
                          <div style="font-size: 11px; color: #a16207; margin-top: 2px;">Assessment Type</div>
                      </div>
                      <div style="text-align: center; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #7dd3fc;">
                          <div style="font-size: 20px; font-weight: 700; color: #0369a1;">Complete</div>
                          <div style="font-size: 11px; color: #0369a1; margin-top: 2px;">Status</div>
                      </div>
                      `
                      }
                  </div>
              </div>
          </div>

          <!-- Page 2: Risk Assessment & Domain Analysis -->
          <div class="page">
              <!-- Risk Assessment Section -->
              ${
                riskScore
                  ? `
              <div class="section" style="background: linear-gradient(135deg, ${getRiskColor(
                riskScore
              )}15 0%, ${getRiskColor(
                      riskScore
                    )}25 100%); border: 2px solid ${getRiskColor(
                      riskScore
                    )}40; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                      <h1 style="font-size: 22px; font-weight: 800; color: #1f2937; margin-bottom: 6px;">Risk Assessment Summary</h1>
                      <div style="width: 60px; height: 2px; background: ${getRiskColor(
                        riskScore
                      )}; margin: 0 auto;"></div>
                  </div>
                  
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                      <div style="flex: 1;">
                          <div style="display: flex; align-items: center; margin-bottom: 12px;">
                              <span style="font-size: 28px; margin-right: 12px;">${getRiskIcon(
                                riskScore
                              )}</span>
                              <div>
                                  <div style="font-size: 24px; font-weight: 800; color: ${getRiskColor(
                                    riskScore
                                  )}; line-height: 1;">
                                      ${getRiskLevelText(riskScore)}
                                  </div>
                                  <div style="font-size: 14px; color: #6b7280; margin-top: 2px;">
                                      Risk Score: ${riskScore}/10
                                  </div>
                              </div>
                          </div>
                          
                          <div style="background: white; padding: 16px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                              <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">Risk Level Interpretation</h3>
                              <p style="color: #374151; line-height: 1.5; margin: 0; font-size: 11px;">
                                  ${
                                    riskScore <= 3
                                      ? "This indicates a low risk level. The assessment suggests minimal concerns in the evaluated areas. Continue with regular monitoring and maintain current supportive practices."
                                      : riskScore <= 7
                                      ? "This indicates a moderate risk level. Some areas may benefit from additional attention and targeted interventions. Consider implementing recommended strategies and monitoring progress."
                                      : "This indicates a high risk level. Several areas require immediate attention and professional intervention. It is strongly recommended to consult with qualified healthcare professionals for comprehensive evaluation and treatment planning."
                                  }
                              </p>
                          </div>
                      </div>
                      
                      <!-- Risk Score Visualization -->
                      <div style="margin-left: 25px; text-align: center;">
                          <div style="width: 100px; height: 100px; border-radius: 50%; background: conic-gradient(${getRiskColor(
                            riskScore
                          )} ${
                      (riskScore / 10) * 360
                    }deg, #e5e7eb 0deg); display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                              <div style="width: 75px; height: 75px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                                  <div style="font-size: 20px; font-weight: 800; color: ${getRiskColor(
                                    riskScore
                                  )}; line-height: 1;">
                                      ${riskScore}
                                  </div>
                                  <div style="font-size: 10px; color: #6b7280; font-weight: 500;">
                                      out of 10
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              `
                  : ""
              }

              <!-- Domain Analysis Section -->
              ${
                domainScores && domainScores.length > 0
                  ? `
              <div class="section" style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <div style="text-align: center; margin-bottom: 20px;">
                      <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 6px;">Developmental Domain Analysis</h2>
                      <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); margin: 0 auto;"></div>
                      <p style="color: #6b7280; margin-top: 8px; font-size: 11px;">Detailed breakdown of performance across key developmental areas</p>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                      ${domainScores
                        .map(
                          (domain, index) => `
                          <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; position: relative; overflow: hidden;">
                              <!-- Domain Icon -->
                              <div style="position: absolute; top: -5px; right: -5px; width: 40px; height: 40px; background: ${getRiskColor(
                                domain.score
                              )}20; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                  <span style="font-size: 16px; color: ${getRiskColor(
                                    domain.score
                                  )};">${
                            index === 0
                              ? "🧠"
                              : index === 1
                              ? "⚡"
                              : index === 2
                              ? "🎯"
                              : "📈"
                          }</span>
                              </div>
                              
                              <div style="margin-bottom: 12px;">
                                  <h3 style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 3px;">${
                                    domain.domain
                                  }</h3>
                                  <div style="display: flex; align-items: center; justify-content: space-between;">
                                      <span style="font-size: 18px; font-weight: 700; color: ${getRiskColor(
                                        domain.score
                                      )};">${domain.score}/10</span>
                                      <span style="font-size: 10px; font-weight: 500; color: ${getRiskColor(
                                        domain.score
                                      )}; background: ${getRiskColor(
                            domain.score
                          )}15; padding: 2px 6px; border-radius: 4px;">
                                          ${
                                            domain.score <= 3
                                              ? "Strong"
                                              : domain.score <= 7
                                              ? "Moderate"
                                              : "Needs Attention"
                                          }
                                      </span>
                                  </div>
                              </div>
                              
                              <!-- Progress Bar -->
                              <div style="background: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                                  <div style="background: linear-gradient(90deg, ${getRiskColor(
                                    domain.score
                                  )}, ${getRiskColor(
                            domain.score
                          )}80); height: 100%; width: ${
                            (domain.score / 10) * 100
                          }%; border-radius: 4px; transition: width 0.3s ease;"></div>
                              </div>
                              
                              ${
                                domain.description
                                  ? `
                              <p style="color: #64748b; font-size: 11px; line-height: 1.4; margin: 0;">${domain.description}</p>
                              `
                                  : ""
                              }
                          </div>
                      `
                        )
                        .join("")}
                  </div>
              </div>
              `
                  : ""
              }
          </div>

          <!-- Page 3: Summary & Analysis -->
          <div class="page">
              ${
                summaryContent.overview
                  ? `
              <!-- Assessment Summary -->
              <div class="section" style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 25px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                  <h2 style="font-size: 18px; font-weight: 700; color: #1f2937; margin-bottom: 16px; display: flex; align-items: center;">
                      <span style="background: #eff6ff; color: #2563eb; padding: 6px; border-radius: 6px; margin-right: 8px; font-size: 14px;">📝</span>
                      Assessment Summary
                  </h2>
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                      <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 12px;">${summaryContent.overview}</p>
                  </div>
              </div>
              `
                  : ""
              }

              <!-- Strengths Section -->
              ${
                summaryContent.strengths && summaryContent.strengths.length > 0
                  ? `
              <div class="section keep-together" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #166534; margin-bottom: 12px; display: flex; align-items: center;">
                      <span style="margin-right: 8px; font-size: 18px;">💪</span>
                      Key Strengths
                  </h3>
                  <ul style="padding-left: 16px; margin: 0;">
                      ${summaryContent.strengths
                        .map(
                          (strength) =>
                            `<li style="color: #166534; margin-bottom: 6px; font-size: 12px; line-height: 1.5;">${strength}</li>`
                        )
                        .join("")}
                  </ul>
              </div>
              `
                  : ""
              }

              <!-- Challenges Section -->
              ${
                summaryContent.challenges &&
                summaryContent.challenges.length > 0
                  ? `
              <div class="section keep-together" style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 1px solid #fde047; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #a16207; margin-bottom: 12px; display: flex; align-items: center;">
                      <span style="margin-right: 8px; font-size: 18px;">⚠️</span>
                      Areas for Development
                  </h3>
                  <ul style="padding-left: 16px; margin: 0;">
                      ${summaryContent.challenges
                        .map(
                          (challenge) =>
                            `<li style="color: #a16207; margin-bottom: 6px; font-size: 12px; line-height: 1.5;">${challenge}</li>`
                        )
                        .join("")}
                  </ul>
              </div>
              `
                  : ""
              }

              <!-- Recommendations Section -->
              ${
                (summaryContent.recommendations &&
                  summaryContent.recommendations.length > 0) ||
                (recommendations && recommendations.length > 0)
                  ? `
              <div class="section keep-together" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #1d4ed8; margin-bottom: 12px; display: flex; align-items: center;">
                      <span style="margin-right: 8px; font-size: 18px;">💡</span>
                      Professional Recommendations
                  </h3>
                  <ul style="padding-left: 16px; margin: 0;">
                      ${(summaryContent.recommendations.length > 0
                        ? summaryContent.recommendations
                        : recommendations
                      )
                        .map(
                          (rec) =>
                            `<li style="color: #1d4ed8; margin-bottom: 6px; font-size: 12px; line-height: 1.5;">${
                              typeof rec === "string" ? rec : rec.text || rec
                            }</li>`
                        )
                        .join("")}
                  </ul>
              </div>
              `
                  : ""
              }

              <!-- Next Steps Section -->
              ${
                summaryContent.nextSteps && summaryContent.nextSteps.length > 0
                  ? `
              <div class="section keep-together" style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border: 1px solid #c084fc; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
                  <h3 style="font-size: 16px; font-weight: 600; color: #7c3aed; margin-bottom: 12px; display: flex; align-items: center;">
                      <span style="margin-right: 8px; font-size: 18px;">🎯</span>
                      Next Steps
                  </h3>
                  <ul style="padding-left: 16px; margin: 0;">
                      ${summaryContent.nextSteps
                        .map(
                          (step) =>
                            `<li style="color: #7c3aed; margin-bottom: 6px; font-size: 12px; line-height: 1.5;">${step}</li>`
                        )
                        .join("")}
                  </ul>
              </div>
              `
                  : ""
              }

              <!-- Disclaimer -->
              <div class="section" style="background: #f9fafb; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-top: 20px;">
                  <h4 style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">Important Disclaimer</h4>
                  <p style="font-size: 10px; color: #6b7280; line-height: 1.4; margin: 0;">
                      This assessment report is generated for educational and informational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for proper evaluation and treatment planning. The results presented are based on the responses provided during the assessment session and should be interpreted within the context of a comprehensive evaluation.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  // Helper method to get child avatar based on gender
  getChildAvatarByGender(gender) {
    const avatars = {
      male: "👦",
      female: "👧",
      boy: "👦",
      girl: "👧",
      default: "🧒",
    };

    return avatars[gender?.toLowerCase()] || avatars.default;
  }

  async getUniversalStyles() {
    return `
      /* Import Nunito font matching your website */
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #1E293B;
        background: white;
        padding: 0;
        margin: 0;
      }
      
      /* Typography matching your UI */
      h1 { 
        font-size: 20px; 
        font-weight: 700; 
        margin-bottom: 12px; 
        line-height: 1.2;
      }
      h2 { 
        font-size: 16px; 
        font-weight: 600; 
        margin-bottom: 10px; 
        line-height: 1.3;
      }
      h3 { 
        font-size: 14px; 
        font-weight: 600; 
        margin-bottom: 8px; 
        line-height: 1.4;
      }
      
      p {
        margin-bottom: 8px;
        line-height: 1.6;
      }
      
      /* Page break utilities */
      .page-break { 
        page-break-before: always; 
      }
      .page-break-avoid { 
        page-break-inside: avoid; 
      }
      .section {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 16px;
        orphans: 3;
        widows: 3;
      }
      .section-large {
        page-break-before: auto;
        break-before: auto;
        margin-bottom: 16px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .section-compact {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 12px;
        orphans: 2;
        widows: 2;
      }
      .keep-together {
        page-break-inside: avoid;
        break-inside: avoid;
        orphans: 3;
        widows: 3;
      }
      
      /* Card styles matching your UI components */
      .card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Layout containers */
      .report-container,
      .article-container,
      .profile-container,
      .dashboard-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
      }
      
      /* Table styles */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
      }
      
      th, td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      
      th {
        background: #f9fafb;
        font-weight: 600;
      }
      
      /* List styles */
      ul, ol {
        padding-left: 20px;
        margin-bottom: 16px;
      }
      
      li {
        margin-bottom: 4px;
      }
      
      /* Image styles */
      img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      
      /* Responsive grid */
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      /* Print optimizations */
      @media print {
        .no-print { 
          display: none !important; 
        }
        .print-only { 
          display: block !important; 
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
      }
    `;
  }

  async getHeaderTemplate(data) {
    return `
      <div style="font-size: 10px; color: #6b7280; padding: 0 15mm; display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center;">
          <strong style="color: #3b82f6;">CogniKidz</strong>
          <span style="margin-left: 8px;">Professional Assessment Platform</span>
        </div>
        <div>Generated: ${new Date().toLocaleDateString()}</div>
      </div>
    `;
  }

  async getFooterTemplate(data) {
    return `
      <div style="font-size: 10px; color: #6b7280; padding: 0 15mm; display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div>© ${new Date().getFullYear()} CogniKidz - Confidential Assessment Report</div>
        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>
    `;
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        // In serverless environments, be more aggressive about cleanup
        const isServerless =
          process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

        if (isServerless) {
          // Close all pages first
          const pages = await this.browser.pages();
          await Promise.all(pages.map((page) => page.close().catch(() => {})));

          // Force close the browser with timeout
          await Promise.race([
            this.browser.close(),
            new Promise((resolve) => setTimeout(resolve, 5000)), // 5s timeout for close
          ]);
        } else {
          await this.browser.close();
        }

        this.browser = null;
        logger.info("🔒 PDF browser closed successfully");
      } catch (error) {
        logger.error("❌ Error closing PDF browser:", error.message);
        // Force null the browser reference even if close failed
        this.browser = null;
      }
    }
  }

  // Cleanup method for graceful shutdown with serverless optimizations
  async cleanup() {
    const isServerless =
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

    await this.closeBrowser();

    if (isServerless) {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info("🗑️ Forced garbage collection in serverless environment");
      }
    }

    logger.info("🧹 Universal PDF Service cleanup completed");
  }

  /**
   * Check if service is healthy
   */
  async healthCheck() {
    try {
      const isConnected = this.browser && this.browser.isConnected();
      return {
        status: isConnected ? "healthy" : "disconnected",
        browserConnected: isConnected,
        isServerless: !!(
          process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
        ),
        hasChromium: !!chromium,
        memoryUsage: process.memoryUsage(),
      };
    } catch (error) {
      return {
        status: "error",
        error: error.message,
        isServerless: !!(
          process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
        ),
        hasChromium: !!chromium,
      };
    }
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  const service = new UniversalPDFService();
  await service.cleanup();
});

process.on("SIGINT", async () => {
  const service = new UniversalPDFService();
  await service.cleanup();
});

module.exports = new UniversalPDFService();
