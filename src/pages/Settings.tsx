import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { auth, db } from '@/services/firebase';
import TopNav from '@/components/TopNav';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');

    (async () => {
      try {
        const d = await getDoc(doc(db, 'users', user.uid));
        if (d.exists()) {
          const data = d.data() as any;
          setFirstName(data.firstName || (user.displayName ? user.displayName.split(' ')[0] : ''));
          setLastName(data.lastName || (user.displayName ? user.displayName.split(' ').slice(1).join(' ') : ''));
        } else if (user.displayName) {
          const parts = user.displayName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
      } catch (err) {
        console.warn('Failed to load user doc:', err);
      }
    })();
  }, [user]);

  if (!user) {
    navigate('/');
    return null;
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (auth.currentUser) {
        if (displayName && displayName !== auth.currentUser.displayName) {
          await updateProfile(auth.currentUser, { displayName });
        }
      }

      try {
        await setDoc(doc(db, 'users', user.uid), {
          firstName: firstName || null,
          lastName: lastName || null,
          displayName: displayName || null,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Failed to update user doc:', err);
      }

      if (newPassword) {
        if (!currentPassword) {
          toast({ title: 'Current password required', description: 'Please enter your current password to change it', variant: 'destructive' });
          setLoading(false);
          return;
        }
        if (auth.currentUser && auth.currentUser.email) {
          const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, cred);
          await updatePassword(auth.currentUser, newPassword);
        }
      }

      toast({ title: 'Profile updated' });
      setEditing(false);
      setNewPassword('');
      setCurrentPassword('');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Failed to update profile';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TopNav />
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto bg-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Account Settings</h2>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setNewPassword(''); setCurrentPassword(''); }}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <div className="mt-1 text-sm">{email}</div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">First Name</label>
              {editing ? (
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md border bg-transparent" />
              ) : (
                <div className="mt-1 text-sm">{firstName || '-'}</div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Last Name</label>
              {editing ? (
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md border bg-transparent" />
              ) : (
                <div className="mt-1 text-sm">{lastName || '-'}</div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Change Password</label>
              {editing ? (
                <div className="mt-1 space-y-2">
                  <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 rounded-md border bg-transparent" />
                  <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-md border bg-transparent" />
                </div>
              ) : (
                <div className="mt-1 text-sm">••••••••</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
