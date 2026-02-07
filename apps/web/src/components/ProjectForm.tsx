import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  project?: {
    id: string;
    name: string;
    description?: string;
    color: string;
  };
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Teal', value: '#14B8A6' },
];

export function ProjectForm({ onSuccess, onCancel, project }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (project) {
        // Update existing project
        await api.put(`/projects/${project.id}`, formData);
        toast.success('Client updated successfully!');
      } else {
        // Create new project
        await api.post('/projects', formData);
        toast.success('Client created successfully!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{project ? 'Edit Client' : 'Add New Client'}</CardTitle>
        <CardDescription>
          {project
            ? 'Update client information'
            : 'Add a new client to organize your monitors (e.g., PFL, HDFC, SBIGIC)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Client Name*</Label>
            <Input
              id="name"
              placeholder="e.g., PFL, HDFC, SBIGIC"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              The name of the client whose websites you're monitoring
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="e.g., Production monitoring for PFL websites"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Brief description of what you're monitoring for this client
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Client Color*</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div
                  className="h-10 w-10 rounded-md border-2 border-border"
                  style={{ backgroundColor: formData.color }}
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`h-8 w-8 rounded-md border-2 transition-all hover:scale-110 ${
                      formData.color === color.value
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color to easily identify this client in the dashboard
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update Client' : 'Create Client'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
