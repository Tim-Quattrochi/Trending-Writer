import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Article } from "@/app/api/articles/article.types";

interface EditArticleProps {
  article: Article;
  onSave: (updatedArticle: Article) => void;
  onCancel: () => void;
}

export function EditArticle({
  article,
  onSave,
  onCancel,
}: EditArticleProps) {
  const [editedArticle, setEditedArticle] = useState(article);

  const handleSave = () => {
    onSave(editedArticle);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="title" className="text-right">
              Title
            </label>
            <Input
              id="title"
              value={editedArticle.title}
              onChange={(e) =>
                setEditedArticle({
                  ...editedArticle,
                  title: e.target.value,
                })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="content" className="text-right">
              Content
            </label>
            <Textarea
              id="content"
              value={editedArticle.content}
              onChange={(e) =>
                setEditedArticle({
                  ...editedArticle,
                  content: e.target.value,
                })
              }
              className="col-span-3"
              rows={10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
