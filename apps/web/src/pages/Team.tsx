import { useEffect, useState } from 'react';
import { Users, UserPlus, Mail, Shield, Trash2, RefreshCw, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'DEVELOPER' | 'VIEWER' | 'USER';
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    name: string | null;
    email: string;
  };
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700 border-red-200',
  DEVELOPER: 'bg-blue-100 text-blue-700 border-blue-200',
  VIEWER: 'bg-gray-100 text-gray-700 border-gray-200',
  USER: 'bg-blue-100 text-blue-700 border-blue-200',
};

const roleDescriptions: Record<string, string> = {
  ADMIN: 'Full access to all features',
  DEVELOPER: 'Manage monitors and view reports',
  VIEWER: 'Read-only access',
};

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'DEVELOPER' | 'VIEWER'>('VIEWER');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [membersRes, invitationsRes] = await Promise.all([
        api.get('/team/members'),
        api.get('/team/invitations'),
      ]);
      setMembers(membersRes.data.data);
      setInvitations(invitationsRes.data.data);
    } catch (error: any) {
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post('/team/invitations', {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success('Invitation sent successfully');
      setInviteEmail('');
      setShowInviteForm(false);
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      await api.delete(`/team/invitations/${id}`);
      toast.success('Invitation revoked');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to revoke invitation');
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await api.post(`/team/invitations/${id}/resend`);
      toast.success('Invitation resent');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await api.put(`/team/members/${memberId}/role`, { role: newRole });
      toast.success('Role updated');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (memberId: string, isActive: boolean) => {
    try {
      await api.put(`/team/members/${memberId}/toggle-status`, { isActive });
      toast.success(isActive ? 'Member activated' : 'Member deactivated');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/team/members/${memberId}`);
      toast.success('Member deleted');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Users className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading team...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your team and their access levels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadTeamData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowInviteForm(!showInviteForm)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Invite New Member</CardTitle>
            <CardDescription>
              Send an invitation email to add a new team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex items-end space-x-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="w-48 space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="VIEWER">Viewer (Read-only)</option>
                  <option value="DEVELOPER">Developer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <Button type="submit" disabled={inviting}>
                <Send className="h-4 w-4 mr-2" />
                {inviting ? 'Sending...' : 'Send Invite'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Pending Invitations</span>
              <Badge variant="secondary">{invitations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-medium">{invite.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {invite.invitedBy.name || invite.invitedBy.email} - Expires {formatDate(invite.expiresAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={roleColors[invite.role]}>
                      {invite.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvitation(invite.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvitation(invite.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Members</span>
            <Badge variant="secondary">{members.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Member</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">2FA</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Login</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{member.name || 'Unnamed'}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        className="text-sm border rounded px-2 py-1 bg-transparent"
                        value={member.role === 'USER' ? 'DEVELOPER' : member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="DEVELOPER">Developer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {member.twoFactorEnabled ? (
                        <Badge variant="outline" className="bg-green-100 text-green-700">
                          <Shield className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(member.id, !member.isActive)}
                        className={member.isActive ? 'text-green-600' : 'text-red-600'}
                      >
                        {member.isActive ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Inactive
                          </>
                        )}
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {member.lastLoginAt ? formatDate(member.lastLoginAt) : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(roleDescriptions).map(([role, description]) => (
              <div key={role} className="p-3 bg-muted/30 rounded-lg">
                <Badge variant="outline" className={roleColors[role]}>
                  {role}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
