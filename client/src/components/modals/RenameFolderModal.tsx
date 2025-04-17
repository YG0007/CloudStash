import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Folder } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255, "Folder name is too long"),
});

type FormValues = z.infer<typeof formSchema>;

type RenameFolderModalProps = {
  folder: Folder | null;
  onClose: () => void;
};

export default function RenameFolderModal({ folder, onClose }: RenameFolderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: folder?.name || '',
    },
  });
  
  // Update form when folder changes
  useEffect(() => {
    if (folder) {
      form.reset({
        name: folder.name,
      });
    }
  }, [folder, form]);
  
  const renameFolder = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!folder) throw new Error("No folder selected");
      
      return apiRequest('PUT', `/api/folders/${folder.id}`, {
        name: data.name,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder renamed successfully",
      });
      
      // Invalidate folders query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/folders'] });
      
      // Close modal
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to rename folder: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  
  const onSubmit = (data: FormValues) => {
    setIsSubmitting(true);
    renameFolder.mutate(data);
  };
  
  return (
    <Dialog open={!!folder} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="rename-folder-description">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <p id="rename-folder-description" className="text-sm text-muted-foreground">
            Enter a new name for the folder.
          </p>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter folder name"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Renaming...
                  </>
                ) : "Rename Folder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}