import { useAuth } from '../../context/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  const role = user?.role || '';

  if (!allowedRoles.includes(role)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '400px', textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#fee2e2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', marginBottom: '16px'
        }}>
          🚫
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
          Access Restricted
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '320px' }}>
          Your role ({role.replace('_', ' ')}) does not have permission to view this page.
          Please contact an administrator if you believe this is an error.
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '8px' }}>
          Contact your system administrator for access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;