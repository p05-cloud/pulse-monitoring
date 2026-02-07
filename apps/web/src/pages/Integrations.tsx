import { useEffect, useState } from 'react';
import { Plug, Plus, Trash2, RefreshCw, TestTube, Slack, MessageSquare, Webhook, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ECGLoader } from '@/components/ui/ECGLoader';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Integration {
  id: string;
  name: string;
  type: 'SLACK' | 'TEAMS' | 'DISCORD' | 'PAGERDUTY' | 'OPSGENIE' | 'WEBHOOK';
  config: any;
  isActive: boolean;
  createdAt: string;
}

const integrationIcons: Record<string, any> = {
  SLACK: Slack,
  TEAMS: MessageSquare,
  DISCORD: MessageSquare,
  WEBHOOK: Webhook,
  PAGERDUTY: Plug,
  OPSGENIE: Plug,
};

const integrationColors: Record<string, string> = {
  SLACK: 'bg-purple-100 text-purple-700 border-purple-200',
  TEAMS: 'bg-blue-100 text-blue-700 border-blue-200',
  DISCORD: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  WEBHOOK: 'bg-gray-100 text-gray-700 border-gray-200',
  PAGERDUTY: 'bg-green-100 text-green-700 border-green-200',
  OPSGENIE: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function Integrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'SLACK' as Integration['type'],
    webhookUrl: '',
    channel: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await api.get('/integrations');
      setIntegrations(response.data.data);
    } catch (error) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const config: any = { webhookUrl: formData.webhookUrl };
      if (formData.type === 'SLACK' && formData.channel) {
        config.channel = formData.channel;
      }

      await api.post('/integrations', {
        name: formData.name,
        type: formData.type,
        config,
      });
      toast.success('Integration created successfully');
      resetForm();
      loadIntegrations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create integration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;
    try {
      await api.delete(`/integrations/${id}`);
      toast.success('Integration deleted');
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to delete integration');
    }
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await api.post(`/integrations/${id}/test`);
      toast.success('Test notification sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Test failed');
    } finally {
      setTesting(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await api.put(`/integrations/${id}`, { isActive });
      toast.success(isActive ? 'Integration enabled' : 'Integration disabled');
      loadIntegrations();
    } catch (error) {
      toast.error('Failed to update integration');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setFormData({
      name: '',
      type: 'SLACK',
      webhookUrl: '',
      channel: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <ECGLoader text="Loading integrations..." size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect PULSE with your favorite tools
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadIntegrations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Available Integrations */}
      <div className="grid grid-cols-3 gap-4">
        {['SLACK', 'TEAMS', 'WEBHOOK'].map((type) => {
          const Icon = integrationIcons[type];
          const count = integrations.filter(i => i.type === type && i.isActive).length;

          return (
            <Card key={type} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setFormData({ ...formData, type: type as any });
              setShowForm(true);
            }}>
              <CardContent className="p-6 flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${integrationColors[type]?.split(' ')[0]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{type}</h3>
                  <p className="text-sm text-muted-foreground">
                    {count} active connection{count !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Add New Integration</CardTitle>
            <CardDescription>
              Configure a new notification channel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    placeholder="My Slack Workspace"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option value="SLACK">Slack</option>
                    <option value="TEAMS">Microsoft Teams</option>
                    <option value="WEBHOOK">Custom Webhook</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder={formData.type === 'SLACK'
                    ? 'https://hooks.slack.com/services/...'
                    : formData.type === 'TEAMS'
                    ? 'https://outlook.office.com/webhook/...'
                    : 'https://your-webhook-url.com/...'
                  }
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.type === 'SLACK' && 'Create an incoming webhook in your Slack workspace settings'}
                  {formData.type === 'TEAMS' && 'Create an incoming webhook connector in your Teams channel'}
                  {formData.type === 'WEBHOOK' && 'Enter your custom webhook endpoint URL'}
                </p>
              </div>

              {formData.type === 'SLACK' && (
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel (optional)</Label>
                  <Input
                    id="channel"
                    placeholder="#alerts"
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Integration'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Active Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No integrations configured yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration) => {
                const Icon = integrationIcons[integration.type] || Plug;

                return (
                  <div
                    key={integration.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${integrationColors[integration.type]?.split(' ')[0]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{integration.name}</span>
                          <Badge variant="outline" className={integrationColors[integration.type]}>
                            {integration.type}
                          </Badge>
                          {integration.isActive ? (
                            <Badge variant="outline" className="bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Webhook: {integration.config?.webhookUrl || 'Configured'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(integration.id)}
                        disabled={testing === integration.id}
                      >
                        <TestTube className={`h-4 w-4 mr-1 ${testing === integration.id ? 'animate-pulse' : ''}`} />
                        {testing === integration.id ? 'Testing...' : 'Test'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(integration.id, !integration.isActive)}
                      >
                        {integration.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(integration.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
