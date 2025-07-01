import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, MessageCircle, Share2, Eye, Edit, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  cursor?: { line: number; column: number };
  color: string;
}

interface Comment {
  id: string;
  fileId: string;
  line: number;
  author: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
}

interface CollaborativeEditorProps {
  projectId: string;
  onShare: (projectId: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  projectId,
  onShare
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'owner-1',
      name: 'You',
      email: 'owner@example.com',
      role: 'owner',
      isOnline: true,
      color: '#3b82f6'
    }
  ]);
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('editor');

  useEffect(() => {
    // Generate shareable link
    const baseUrl = window.location.origin;
    setShareLink(`${baseUrl}/shared/${projectId}`);
    
    // Simulate real-time collaboration updates
    const interval = setInterval(() => {
      // Simulate collaborator activity
      setCollaborators(prev => prev.map(collab => 
        collab.id !== 'owner-1' ? {
          ...collab,
          cursor: {
            line: Math.floor(Math.random() * 50),
            column: Math.floor(Math.random() * 80)
          }
        } : collab
      ));
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId]);

  const handleInviteCollaborator = () => {
    // Disabled - show tooltip instead
    return;
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      fileId: 'current-file',
      line: 1,
      author: 'You',
      content: newComment,
      timestamp: new Date(),
      resolved: false
    };

    setComments(prev => [...prev, comment]);
    setNewComment('');
    toast.success('Comment added');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'editor': return <Edit className="h-4 w-4 text-green-500" />;
      case 'viewer': return <Eye className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Collaborators Panel */}
      <Card className="bg-editor-sidebar border-editor-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-editor-text flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Collaborators ({collaborators.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Active Collaborators */}
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-2 rounded bg-editor-active">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: collab.color }}
                  />
                  <span className="text-editor-text text-sm">{collab.name}</span>
                  {getRoleIcon(collab.role)}
                  <Badge 
                    variant={collab.isOnline ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {collab.isOnline ? 'online' : 'offline'}
                  </Badge>
                </div>
                {collab.cursor && (
                  <span className="text-xs text-editor-text-muted">
                    L{collab.cursor.line}:C{collab.cursor.column}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Invite New Collaborator - Disabled */}
          <div className="space-y-2 pt-2 border-t border-editor-border">
            <div className="flex space-x-2">
              <Input
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-editor border-editor-border text-editor-text"
                disabled
              />
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'editor' | 'viewer')}
                className="bg-editor border-editor-border text-editor-text rounded px-3 opacity-50 cursor-not-allowed"
                disabled
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleInviteCollaborator}
                    size="sm" 
                    className="w-full opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Invite
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Feature coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Share Link */}
          <div className="space-y-2 pt-2 border-t border-editor-border">
            <div className="flex space-x-2">
              <Input
                readOnly
                value={shareLink}
                className="bg-editor border-editor-border text-editor-text"
              />
              <Button onClick={copyShareLink} size="sm" variant="outline">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Panel */}
      <Card className="bg-editor-sidebar border-editor-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-editor-text flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Comments ({comments.length})
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChat(!showChat)}
              className="ml-auto"
            >
              {showChat ? 'Hide' : 'Show'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showChat && (
          <CardContent className="space-y-3">
            {/* Existing Comments */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="p-2 rounded bg-editor-active">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-editor-text">
                      {comment.author}
                    </span>
                    <span className="text-xs text-editor-text-muted">
                      Line {comment.line}
                    </span>
                  </div>
                  <p className="text-sm text-editor-text">{comment.content}</p>
                  <span className="text-xs text-editor-text-muted">
                    {comment.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Add New Comment */}
            <div className="space-y-2 pt-2 border-t border-editor-border">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-editor border-editor-border text-editor-text resize-none"
                rows={2}
              />
              <Button onClick={handleAddComment} size="sm" className="w-full">
                Add Comment
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default CollaborativeEditor;
