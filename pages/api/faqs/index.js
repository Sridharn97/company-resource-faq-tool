import dbConnect from '../../../lib/mongodb';
import FAQ from '../../../models/FAQ';
import { requireAdmin } from '../../../lib/middleware';

// GET all FAQs or CREATE new FAQ
export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { search, category, tags } = req.query;
      
      let query = {};
      
      // Search by question or tags
      if (search) {
        query.$or = [
          { question: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }
      
      // Filter by category
      if (category && category !== 'all') {
        query.category = category;
      }
      
      // Filter by tags
      if (tags && tags !== 'all') {
        query.tags = { $in: [tags] };
      }

      const faqs = await FAQ.find(query)
        .populate('createdBy', 'email')
        .sort({ createdAt: -1 });

      // Get unique categories and tags for filters
      const allFaqs = await FAQ.find({});
      const categories = [...new Set(allFaqs.map(faq => faq.category))];
      const allTags = [...new Set(allFaqs.flatMap(faq => faq.tags))];

      res.status(200).json({
        faqs,
        categories,
        tags: allTags,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
  } else if (req.method === 'POST') {
    // Create FAQ - Admin only
    return requireAdmin(async (req, res) => {
      const { question, answer, category, tags } = req.body;

      if (!question || !answer || !category) {
        return res.status(400).json({ error: 'Question, answer, and category are required' });
      }

      try {
        const faq = new FAQ({
          question,
          answer,
          category,
          tags: tags || [],
          createdBy: req.user.userId,
        });

        await faq.save();
        await faq.populate('createdBy', 'email');

        res.status(201).json(faq);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create FAQ' });
      }
    })(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}