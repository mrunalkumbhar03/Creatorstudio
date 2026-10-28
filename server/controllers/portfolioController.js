
const Portfolio = require("../models/Portfolio");

const allowedPlatforms = [
  "Behance",
  "GitHub",
  "Instagram",
  "Website",
  "YouTube",
  "LinkedIn",
  "Other",
];

function validatePortfolioData(data) {
  const { title, category, externalLinks } = data;

  if (!title?.trim() || !category?.trim()) {
    return "Title and category are required.";
  }

  if (externalLinks !== undefined && !Array.isArray(externalLinks)) {
    return "External links must be an array.";
  }

  if (externalLinks) {
    for (const link of externalLinks) {
      if (!allowedPlatforms.includes(link.platform)) {
        return `Invalid platform: ${link.platform}`;
      }

      try {
        const parsedUrl = new URL(link.url);

        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return "Links must use HTTP or HTTPS.";
        }
      } catch {
        return "Please provide valid URLs for all external links.";
      }
    }
  }

  return null;
}

// Create portfolio
exports.createPortfolio = async (req, res) => {
  try {
    const validationError = validatePortfolioData(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { title, description, category, externalLinks } = req.body;

    const portfolio = await Portfolio.create({
      creatorId: req.user.userId,
      title,
      description,
      category,
      externalLinks: externalLinks || [],
    });

    return res.status(201).json({
      message: "Portfolio created successfully.",
      portfolio,
    });
  } catch (error) {
    console.error("Create portfolio error:", error);
    return res.status(500).json({
      message: "Unable to create portfolio.",
    });
  }
};

// Get current creator's portfolios
exports.getMyPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find({
      creatorId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ portfolio });
  } catch (error) {
    console.error("Get my portfolio error:", error);
    return res.status(500).json({
      message: "Unable to load portfolio.",
    });
  }
};

// Get one portfolio
exports.getPortfolioById = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found.",
      });
    }

    return res.status(200).json({ portfolio });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid portfolio ID.",
      });
    }

    console.error("Get portfolio error:", error);
    return res.status(500).json({
      message: "Unable to load portfolio.",
    });
  }
};

// Update portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const validationError = validatePortfolioData(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      creatorId: req.user.userId,
    });

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found or access denied.",
      });
    }

    const { title, description, category, externalLinks } = req.body;

    if (title !== undefined) portfolio.title = title;
    if (description !== undefined) portfolio.description = description;
    if (category !== undefined) portfolio.category = category;
    if (externalLinks !== undefined) {
      portfolio.externalLinks = externalLinks;
    }

    await portfolio.save();

    return res.status(200).json({
      message: "Portfolio updated successfully.",
      portfolio,
    });
  } catch (error) {
    console.error("Update portfolio error:", error);
    return res.status(500).json({
      message: "Unable to update portfolio.",
    });
  }
};

// Delete portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndDelete({
      _id: req.params.id,
      creatorId: req.user.userId,
    });

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found or access denied.",
      });
    }

    return res.status(200).json({
      message: "Portfolio deleted successfully.",
    });
  } catch (error) {
    console.error("Delete portfolio error:", error);
    return res.status(500).json({
      message: "Unable to delete portfolio.",
    });
  }
};

/* Get a public portfolio for clients */
exports.getPublicPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id).select(
      "title description category externalLinks createdAt"
    );

    if (!portfolio) {
      return res.status(404).json({
        message: "Portfolio not found.",
      });
    }

    return res.status(200).json({ portfolio });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid portfolio ID.",
      });
    }

    console.error("Get public portfolio error:", error);

    return res.status(500).json({
      message: "Unable to load portfolio.",
    });
  }
};
