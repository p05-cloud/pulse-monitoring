import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import api from '@/lib/api';
import type { Project, Monitor } from '@/types';
import { toast } from 'sonner';

interface MonitorFormProps {
  monitorId?: string; // If provided, we're editing
  initialData?: Monitor; // Pre-populated data for editing
  onSuccess: () => void;
  onCancel: () => void;
}

export function MonitorForm({ monitorId, initialData, onSuccess, onCancel }: MonitorFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const isEditMode = !!monitorId;

  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || '',
    name: initialData?.name || '',
    url: initialData?.url || '',
    method: (initialData?.method || 'GET') as Monitor['method'],
    intervalSeconds: initialData?.intervalSeconds || 60,
    timeoutMs: initialData?.timeoutMs || 30000,
    expectedStatus: initialData?.expectedStatus || 200,
    keyword: initialData?.keyword || '',
    body: initialData?.body || '',
    tags: initialData?.tags?.join(', ') || '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
      if (response.data.data.length > 0) {
        setFormData(prev => ({ ...prev, projectId: response.data.data[0].id }));
      }
    } catch (error: any) {
      toast.error('Failed to load projects');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        ...formData,
        tags,
        keyword: formData.keyword || null,
        body: formData.body || null,
      };

      if (isEditMode) {
        await api.put(`/monitors/${monitorId}`, payload);
        toast.success('Monitor updated successfully!');
      } else {
        await api.post('/monitors', payload);
        toast.success('Monitor created successfully!');
      }

      onSuccess();
    } catch (error: any) {
      const action = isEditMode ? 'update' : 'create';
      toast.error(error.response?.data?.message || `Failed to ${action} monitor`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Monitor' : 'Create New Monitor'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'Update monitor configuration' : 'Add a new URL to monitor'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name*</Label>
              <Input
                id="name"
                placeholder="Production API"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project*</Label>
              <select
                id="project"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                required
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL*</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://api.example.com/health"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="method">HTTP Method</Label>
              <select
                id="method"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as Monitor['method'] })}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interval">Interval (seconds)</Label>
              <Input
                id="interval"
                type="number"
                min="60"
                max="3600"
                value={formData.intervalSeconds}
                onChange={(e) => setFormData({ ...formData, intervalSeconds: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedStatus">Expected Status</Label>
              <Input
                id="expectedStatus"
                type="number"
                min="100"
                max="599"
                value={formData.expectedStatus}
                onChange={(e) => setFormData({ ...formData, expectedStatus: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                min="5000"
                max="60000"
                step="1000"
                value={formData.timeoutMs}
                onChange={(e) => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword (optional)</Label>
              <Input
                id="keyword"
                placeholder="Check for this text in response"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Request Body (optional)</Label>
            <Textarea
              id="body"
              placeholder='{"key": "value"} or plain text'
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              className="font-mono text-sm"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              For POST/PUT/PATCH/DELETE requests. Accepts JSON or plain text.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="production, api, critical"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading
                ? (isEditMode ? 'Updating...' : 'Creating...')
                : (isEditMode ? 'Update Monitor' : 'Create Monitor')
              }
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
