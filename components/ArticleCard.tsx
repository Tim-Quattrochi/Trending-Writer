import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import Link from "next/link";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThumbsUp, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  likes?: number;
  comments?: number;
  keyWords?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    avatar: string;
  };
}

export default function ArticleCard({
  article,
}: {
  article: Article;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  //   const handleLike = async () => {
  //     try {
  //       const response = await fetch(
  //         `/api/articles/${article.id}/like`,
  //         { method: "POST" }
  //       );
  //       if (!response.ok) {
  //         throw new Error("Failed to like article");
  //       }

  //       article.likes += 1;
  //     } catch (error) {
  //       console.error("Error liking article:", error);
  //       toast({
  //         title: "Error liking article",
  //         description:
  //           "There was a problem liking the article. Please try again.",
  //         variant: "destructive",
  //       });
  //     }
  //   };

  // WIP
  //   const handleLoadComments = async () => {
  //     if (!isExpanded) {
  //       setIsLoading(true);
  //       try {
  //         const response = await fetch(
  //           `/api/articles/${article.id}/comments`
  //         );
  //         if (!response.ok) {
  //           throw new Error("Failed to fetch comments");
  //         }
  //         const data = await response.json();
  //         setComments(data);
  //       } catch (error) {
  //         console.error("Error fetching comments:", error);
  //         toast({
  //           title: "Error fetching comments",
  //           description:
  //             "There was a problem loading the comments. Please try again.",
  //           variant: "destructive",
  //         });
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     }
  //     setIsExpanded(!isExpanded);
  //   };

  // WIP
  //   const handleAddComment = async () => {
  //     if (!newComment.trim()) return;

  //     setIsLoading(true);
  //     try {
  //       const response = await fetch(
  //         `/api/articles/${article.id}/comments`,
  //         {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ content: newComment }),
  //         }
  //       );
  //       if (!response.ok) {
  //         throw new Error("Failed to add comment");
  //       }
  //       const addedComment = await response.json();
  //       setComments([...comments, addedComment]);
  //       setNewComment("");
  //       article.comments += 1;
  //     } catch (error) {
  //       console.error("Error adding comment:", error);
  //       toast({
  //         title: "Error adding comment",
  //         description:
  //           "There was a problem adding your comment. Please try again.",
  //         variant: "destructive",
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Link href={`/articles/${article.id}`}>
            {article.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3">{article.content}</p>
        {isExpanded && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Comments</h4>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start space-x-2 mb-2"
              >
                <Avatar>
                  <AvatarImage
                    src={comment.user.avatar}
                    alt={comment.user.name}
                  />
                  <AvatarFallback>
                    {comment.user.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{comment.user.name}</p>
                  <p className="text-sm text-gray-500">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="mt-2"
            />
            <Button disabled={isLoading} className="mt-2">
              {isLoading ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm">
          <ThumbsUp className="mr-2 h-4 w-4" /> {article.likes}
        </Button>
        <Button variant="ghost" size="sm">
          <MessageSquare className="mr-2 h-4 w-4" />{" "}
          {article.comments}
        </Button>
      </CardFooter>
    </Card>
  );
}
