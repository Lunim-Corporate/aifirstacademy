import { RequestHandler, Router } from "express";
import { getLibraryResources, createLibraryResource, getUserById } from "../storage-supabase";
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

export const listResources: RequestHandler = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    
    // Get user's persona role if authenticated
    let userRole = "engineer"; // default
    if (userId) {
      const user = await getUserById(userId);
      userRole = user?.persona_role || "engineer";
    }

    // Get library resources from Supabase
    const resources = await getLibraryResources({
      limit: 1000, // Get all resources
      tags: [`role:${userRole}`] // Filter by user's role
    });

    // Separate resources by type for compatibility
    const templates = resources.filter(r => r.type === "template");
    const guides = resources.filter(r => r.type === "guide");

    const response = {
      academy: resources.map(item => ({
        ...item,
        role: userRole,
        totalCount: resources.length,
        // Map fields for frontend compatibility
        createdAt: item.created_at
      })),
      user: [], // User-specific resources - TODO: implement user library
      metadata: {
        userRole: userRole,
        totalAcademyItems: resources.length,
        templateCount: templates.length,
        guideCount: guides.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing resources:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createResource: RequestHandler = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    const { resource } = req.body as { resource?: any };
    if (!resource || !resource.type || !resource.title) {
      return res.status(400).json({ error: "Invalid resource" });
    }

    const created = await createLibraryResource({
      ...resource,
      tags: resource.tags || []
    });

    res.status(201).json({ 
      resource: {
        ...created,
        createdAt: created.created_at
      }
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteResource: RequestHandler = async (req, res) => {
  try {
    const { id: userId } = getUser(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    
    // TODO: Implement delete resource in Supabase
    // For now, return success
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

router.get("/resources", listResources);
router.post("/resources", createResource);
router.delete("/resources/:id", deleteResource);

export default router;
