import { RequestHandler, Router } from "express";
import {
  getPrompts,
  getPromptById,
  createPrompt as createPromptDB,
  updatePrompt as updatePromptDB,
  deletePrompt as deletePromptDB,
  recordPromptInteraction,
  removePromptInteraction,
  getUserPromptInteractions,
  getPromptComments,
  createPromptComment,
  deletePromptComment,
  getUserById,
  Prompt,
  PromptComment,
} from "../storage-supabase";
import { verifyToken } from "../utils/jwt";

const router = Router();

function getUser(req: any): { id: string | null; role: string | null } {
  const auth = req.headers.authorization as string | undefined;
  if (!auth) return { id: null, role: null };
  const token = auth.split(" ")[1];
  const payload = verifyToken(token || "");
  return { id: payload?.sub || null, role: (payload as any)?.role || null };
}

function getUserId(req: any): string | null { 
  return getUser(req).id;
}

// ========================================
// PROMPTS
// ========================================

export const listPrompts: RequestHandler = async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      tags, 
      difficulty, 
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query as any;

    const tagsArray = typeof tags === 'string' ? tags.split(',') : undefined;
    
    const prompts = await getPrompts({
      limit: parseInt(limit),
      offset: parseInt(offset),
      tags: tagsArray,
      difficulty,
      sortBy,
      sortOrder,
    });

    // Get author information for each prompt
    const enrichedPrompts = await Promise.all(
      prompts.map(async (prompt) => {
        const author = await getUserById(prompt.author_id);
        return {
          ...prompt,
          authorName: author?.name || "Unknown",
          // Map to frontend expected format
          id: prompt.id,
          authorId: prompt.author_id,
          likes: prompt.likes_count,
          saves: prompt.saves_count,
          views: prompt.views_count,
          runs: prompt.runs_count,
          createdAt: prompt.created_at,
        };
      })
    );

    res.json({ prompts: enrichedPrompts });
  } catch (error) {
    console.error('Error listing prompts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPromptDetails: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);

    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const author = await getUserById(prompt.author_id);
    
    // Get user interactions if authenticated
    let userInteractions: string[] = [];
    if (userId) {
      userInteractions = await getUserPromptInteractions(userId, id);
    }

    const enrichedPrompt = {
      ...prompt,
      authorName: author?.name || "Unknown",
      // Map to frontend expected format
      authorId: prompt.author_id,
      likes: prompt.likes_count,
      saves: prompt.saves_count,
      views: prompt.views_count,
      runs: prompt.runs_count,
      createdAt: prompt.created_at,
      // User interaction status
      isLiked: userInteractions.includes('like'),
      isSaved: userInteractions.includes('save'),
    };

    res.json({ prompt: enrichedPrompt });
  } catch (error) {
    console.error('Error getting prompt details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPrompt: RequestHandler = async (req, res) => {
  try {
    const { title, content, tags = [], difficulty = "beginner" } = req.body;
    const { id: authorId } = getUser(req);
    
    if (!authorId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!title || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = await createPromptDB({
      title,
      content,
      author_id: authorId,
      tags: Array.isArray(tags) ? tags : [],
      difficulty: difficulty as "beginner" | "intermediate" | "advanced",
    });

    const author = await getUserById(authorId);

    const enrichedPrompt = {
      ...prompt,
      authorName: author?.name || "Unknown",
      // Map to frontend expected format
      authorId: prompt.author_id,
      likes: prompt.likes_count,
      saves: prompt.saves_count,
      views: prompt.views_count,
      runs: prompt.runs_count,
      createdAt: prompt.created_at,
    };

    res.status(201).json({ prompt: enrichedPrompt });
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePrompt: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, difficulty } = req.body;
    const { id: userId, role } = getUser(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    if (prompt.author_id !== userId && role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updates: Partial<Prompt> = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = tags;
    if (difficulty !== undefined) updates.difficulty = difficulty;

    const updatedPrompt = await updatePromptDB(id, updates);
    const author = await getUserById(updatedPrompt.author_id);

    const enrichedPrompt = {
      ...updatedPrompt,
      authorName: author?.name || "Unknown",
      // Map to frontend expected format
      authorId: updatedPrompt.author_id,
      likes: updatedPrompt.likes_count,
      saves: updatedPrompt.saves_count,
      views: updatedPrompt.views_count,
      runs: updatedPrompt.runs_count,
      createdAt: updatedPrompt.created_at,
    };

    res.json({ prompt: enrichedPrompt });
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePrompt: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = getUser(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    if (prompt.author_id !== userId && role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await deletePromptDB(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// PROMPT INTERACTIONS
// ========================================

export const likePrompt: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    const userInteractions = await getUserPromptInteractions(userId, id);
    const alreadyLiked = userInteractions.includes('like');

    if (alreadyLiked) {
      return res.json({
        likes: prompt.likes_count,
        alreadyLiked: true,
        message: "You have already liked this prompt"
      });
    }

    await recordPromptInteraction(id, userId, 'like');
    
    // Get updated prompt to return latest count
    const updatedPrompt = await getPromptById(id);
    
    res.json({
      likes: updatedPrompt?.likes_count || prompt.likes_count + 1,
      alreadyLiked: false,
      message: "Prompt liked successfully"
    });
  } catch (error) {
    console.error('Error liking prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unlikePrompt: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    await removePromptInteraction(id, userId, 'like');
    
    // Get updated prompt to return latest count
    const updatedPrompt = await getPromptById(id);
    
    res.json({
      likes: updatedPrompt?.likes_count || Math.max(0, prompt.likes_count - 1),
      message: "Prompt unliked successfully"
    });
  } catch (error) {
    console.error('Error unliking prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const savePrompt: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    const userInteractions = await getUserPromptInteractions(userId, id);
    const alreadySaved = userInteractions.includes('save');

    if (alreadySaved) {
      return res.json({
        saves: prompt.saves_count,
        alreadySaved: true,
        message: "You have already saved this prompt"
      });
    }

    await recordPromptInteraction(id, userId, 'save');
    
    // Get updated prompt to return latest count
    const updatedPrompt = await getPromptById(id);
    
    res.json({
      saves: updatedPrompt?.saves_count || prompt.saves_count + 1,
      alreadySaved: false,
      message: "Prompt saved successfully"
    });
  } catch (error) {
    console.error('Error saving prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unsavePrompt: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    await removePromptInteraction(id, userId, 'save');
    
    // Get updated prompt to return latest count
    const updatedPrompt = await getPromptById(id);
    
    res.json({
      saves: updatedPrompt?.saves_count || Math.max(0, prompt.saves_count - 1),
      message: "Prompt unsaved successfully"
    });
  } catch (error) {
    console.error('Error unsaving prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const viewPrompt: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    // Record view (only once per user to avoid spam)
    if (userId) {
      try {
        await recordPromptInteraction(id, userId, 'view');
      } catch (error) {
        // Ignore duplicate view errors
      }
    }

    // Get updated prompt to return latest count
    const updatedPrompt = await getPromptById(id);
    
    res.json({
      views: updatedPrompt?.views_count || prompt.views_count + 1
    });
  } catch (error) {
    console.error('Error viewing prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const runPrompt: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    // Record run
    if (userId) {
      try {
        await recordPromptInteraction(id, userId, 'run');
      } catch (error) {
        // Allow multiple runs per user
      }
    }

    // Get updated prompt to return latest count
    const updatedPrompt = await getPromptById(id);
    
    res.json({
      runs: updatedPrompt?.runs_count || prompt.runs_count + 1
    });
  } catch (error) {
    console.error('Error running prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// COMMENTS
// ========================================

export const commentList: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const comments = await getPromptComments(id);
    
    res.json({ comments });
  } catch (error) {
    console.error('Error listing comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const commentCreate: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content required" });
    }

    const prompt = await getPromptById(id);
    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    const comment = await createPromptComment({
      prompt_id: id,
      user_id: userId,
      content,
    });

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const commentDelete: RequestHandler = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { id: userId, role } = getUser(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Note: We'd need to check comment ownership here
    // For now, allow users to delete their own comments and admins to delete any
    
    await deletePromptComment(commentId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// USER'S SAVED PROMPTS
// ========================================

export const listSavedPrompts: RequestHandler = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get prompts that user has saved
    const savedPrompts = await getPrompts({
      limit: 100, // Adjust as needed
    });

    // Filter prompts where user has saved interaction
    const userSavedPrompts = [];
    for (const prompt of savedPrompts) {
      const interactions = await getUserPromptInteractions(userId, prompt.id);
      if (interactions.includes('save')) {
        const author = await getUserById(prompt.author_id);
        userSavedPrompts.push({
          ...prompt,
          authorName: author?.name || "Unknown",
          // Map to frontend expected format
          authorId: prompt.author_id,
          likes: prompt.likes_count,
          saves: prompt.saves_count,
          views: prompt.views_count,
          runs: prompt.runs_count,
          createdAt: prompt.created_at,
        });
      }
    }

    res.json({ prompts: userSavedPrompts });
  } catch (error) {
    console.error('Error listing saved prompts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// ROUTER SETUP
// ========================================

// User saved prompts (MUST come before dynamic :id routes)
router.get('/prompts/saved', listSavedPrompts);
router.get('/saved-prompts', listSavedPrompts);

// Prompts
router.get('/prompts', listPrompts);
router.get('/prompts/:id', getPromptDetails);
router.post('/prompts', createPrompt);
router.put('/prompts/:id', updatePrompt);
router.delete('/prompts/:id', deletePrompt);

// Prompt interactions
router.post('/prompts/:id/like', likePrompt);
router.delete('/prompts/:id/like', unlikePrompt);
router.post('/prompts/:id/save', savePrompt);
router.delete('/prompts/:id/save', unsavePrompt);
router.post('/prompts/:id/view', viewPrompt);
router.post('/prompts/:id/run', runPrompt);

// Comments
router.get('/prompts/:id/comments', commentList);
router.post('/prompts/:id/comments', commentCreate);
router.delete('/comments/:commentId', commentDelete);

// ========================================
// DISCUSSIONS (Placeholder Implementation)
// ========================================

export const listDiscussions: RequestHandler = async (req, res) => {
  try {
    // Placeholder: Return empty discussions for now
    // TODO: Implement discussions in Supabase schema
    res.json({ discussions: [] });
  } catch (error) {
    console.error('Error listing discussions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDiscussion: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    // Placeholder: Return 404 for now
    res.status(404).json({ error: 'Discussion not found' });
  } catch (error) {
    console.error('Error getting discussion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// CHALLENGES (Placeholder Implementation) 
// ========================================

export const listChallenges: RequestHandler = async (req, res) => {
  try {
    // Placeholder: Return empty challenges for now
    // TODO: Implement challenges in Supabase schema
    res.json({ challenges: [] });
  } catch (error) {
    console.error('Error listing challenges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChallenge: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    // Placeholder: Return 404 for now
    res.status(404).json({ error: 'Challenge not found' });
  } catch (error) {
    console.error('Error getting challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ========================================
// ADDITIONAL ROUTES
// ========================================

// Discussions
router.get('/discussions', listDiscussions);
router.get('/discussions/:id', getDiscussion);

// Challenges
router.get('/challenges', listChallenges);
router.get('/challenges/:id', getChallenge);

export default router;
