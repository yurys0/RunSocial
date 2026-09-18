import { Link, useNavigate } from 'react-router-dom';

import { Avatar } from '../shared/ui';
import { FeedIcon, FriendsIcon, LogoutIcon, PeopleIcon } from '../shared/ui/icons';
import { useAuth } from './auth-context';
import { useIncomingRequestsCount } from './use-incoming-requests';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const incomingRequests = useIncomingRequestsCount(Boolean(user));

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/mark.png" alt="" width={28} height={28} />
          RunSocial
        </Link>
        <nav className="header-nav">
          {user ? (
            <>
              <Link to="/feed" className="nav-icon" title="Лента" aria-label="Лента">
                <FeedIcon />
              </Link>
              <Link to="/friends" className="nav-icon" title="Друзья" aria-label="Друзья">
                <FriendsIcon />
                {incomingRequests > 0 && (
                  <span className="nav-badge" aria-label={`Новых заявок: ${incomingRequests}`}>
                    {incomingRequests}
                  </span>
                )}
              </Link>
              <Link to="/people" className="nav-icon" title="Люди" aria-label="Люди">
                <PeopleIcon />
              </Link>
              <Link to={`/u/${user.login}`} title="Мой профиль">
                <Avatar url={user.avatarUrl} name={user.displayName} />
              </Link>
              <button
                type="button"
                className="nav-icon"
                title="Выйти"
                aria-label="Выйти"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <LogoutIcon />
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Войти</Link>
              <Link to="/register">
                <button className="btn btn-sm">Регистрация</button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
