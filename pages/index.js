import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchFaqs();
  }, [search, selectedCategory, selectedTag]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData.user);
      }
    } catch (error) {
      // User not logged in
    }
  };

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedTag !== 'all') params.append('tags', selectedTag);

      const res = await fetch(`/api/faqs?${params}`);
      const data = await res.json();
      
      setFaqs(data.faqs);
      setCategories(data.categories);
      setTags(data.tags);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <Head>
        <title>Company Resource FAQ</title>
        <meta name="description" content="Company Resource FAQ Tool" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>Company Resource FAQ</h1>
          <nav className={styles.nav}>
            {user ? (
              <>
                <span>Welcome, {user.email}</span>
                {user.role === 'admin' && (
                  <Link href="/admin/dashboard">Admin Dashboard</Link>
                )}
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link href="/login">Login</Link>
                <Link href="/signup">Sign Up</Link>
              </>
            )}
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            
            <div className={styles.filters}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>Loading FAQs...</div>
          ) : (
            <div className={styles.faqList}>
              {faqs.length === 0 ? (
                <p>No FAQs found matching your search criteria.</p>
              ) : (
                faqs.map(faq => (
                  <div key={faq._id} className={styles.faqCard}>
                    <Link href={`/faq/${faq._id}`}>
                      <h3>{faq.question}</h3>
                    </Link>
                    <div className={styles.faqMeta}>
                      <span className={styles.category}>{faq.category}</span>
                      <span className={styles.views}>{faq.views} views</span>
                      <div className={styles.tags}>
                        {faq.tags.map(tag => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}