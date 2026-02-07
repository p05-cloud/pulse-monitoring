import { useEffect, useState } from 'react';
import { Plus, Calendar, Clock, Trash2, RefreshCw, Play, Pause, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ECGLoader } from '@/components/ui/ECGLoader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type { Monitor } from '@/types';

interface MaintenanceWindow {
  id: string;
  name: string;
  description: string | null;
  monitorIds: string[];
  startTime: string;
  endTime: string;
  timezone: string;
  recurring: boolean;
  cronPattern: string | null;
  notifyBefore: number;
  isActive: boolean;
  createdAt: string;
}

export function Maintenance() {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWindow, setEditingWindow] = useState<MaintenanceWindow | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monitorIds: [] as string[],
    startTime: '',
    endTime: '',
    timezone: 'UTC',
    notifyBefore: 30,
    recurring: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [windowsRes, monitorsRes] = await Promise.all([
        api.get('/maintenance'),
        api.get('/monitors'),
      ]);
      setWindows(windowsRes.data.data);
      setMonitors(monitorsRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingWindow) {
        await api.put(`/maintenance/${editingWindow.id}`, formData);
        toast.success('Maintenance window updated');
      } else {
        await api.post('/maintenance', formData);
        toast.success('Maintenance window created');
      }
      resetForm();
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this maintenance window?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      toast.success('Maintenance window deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/maintenance/${id}/toggle`, { isActive });
      toast.success(isActive ? 'Maintenance window activated' : 'Maintenance window paused');
      loadData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleEdit = (window: MaintenanceWindow) => {
    setEditingWindow(window);
    setFormData({
      name: window.name,
      description: window.description || '',
      monitorIds: window.monitorIds,
      startTime: window.startTime.slice(0, 16),
      endTime: window.endTime.slice(0, 16),
      timezone: window.timezone,
      notifyBefore: window.notifyBefore,
      recurring: window.recurring,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingWindow(null);
    setFormData({
      name: '',
      description: '',
      monitorIds: [],
      startTime: '',
      endTime: '',
      timezone: 'UTC',
      notifyBefore: 30,
      recurring: false,
    });
  };

  const getWindowStatus = (window: MaintenanceWindow) => {
    const now = new Date();
    const start = new Date(window.startTime);
    const end = new Date(window.endTime);

    if (!window.isActive) return { status: 'paused', color: 'bg-gray-100 text-gray-700' };
    if (now >= start && now <= end) return { status: 'active', color: 'bg-green-100 text-green-700' };
    if (now < start) return { status: 'scheduled', color: 'bg-blue-100 text-blue-700' };
    return { status: 'completed', color: 'bg-gray-100 text-gray-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ECGLoader text="Loading maintenance..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Windows</h1>
          <p className="text-muted-foreground">
            Schedule planned downtime to suppress alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{editingWindow ? 'Edit Maintenance Window' : 'Schedule New Maintenance'}</CardTitle>
            <CardDescription>
              Define a time window when monitoring alerts will be suppressed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Server maintenance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notifyBefore">Notify Before (minutes)</Label>
                  <Input
                    id="notifyBefore"
                    type="number"
                    min="0"
                    max="1440"
                    value={formData.notifyBefore}
                    onChange={(e) => setFormData({ ...formData, notifyBefore: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Reason for maintenance..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Affected Monitors</Label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {monitors.map((monitor) => (
                    <label key={monitor.id} className="flex items-center space-x-2 cursor-pointer hover:bg-muted/30 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.monitorIds.includes(monitor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, monitorIds: [...formData.monitorIds, monitor.id] });
                          } else {
                            setFormData({ ...formData, monitorIds: formData.monitorIds.filter(id => id !== monitor.id) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm truncate">{monitor.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.monitorIds.length} monitor(s) selected
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingWindow ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Windows List */}
      <div className="grid gap-4">
        {windows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No maintenance windows scheduled</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule First Maintenance
              </Button>
            </CardContent>
          </Card>
        ) : (
          windows.map((window) => {
            const { status, color } = getWindowStatus(window);
            const affectedMonitors = monitors.filter(m => window.monitorIds.includes(m.id));

            return (
              <Card key={window.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-lg">{window.name}</h3>
                        <Badge variant="outline" className={color}>
                          {status.toUpperCase()}
                        </Badge>
                        {window.recurring && (
                          <Badge variant="secondary">Recurring</Badge>
                        )}
                      </div>
                      {window.description && (
                        <p className="text-sm text-muted-foreground">{window.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(window.startTime)} - {formatDate(window.endTime)}
                        </span>
                        <span>({window.timezone})</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-1">
                        {affectedMonitors.slice(0, 5).map((m) => (
                          <Badge key={m.id} variant="outline" className="text-xs">
                            {m.name}
                          </Badge>
                        ))}
                        {affectedMonitors.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{affectedMonitors.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(window.id, !window.isActive)}
                      >
                        {window.isActive ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(window)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(window.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
