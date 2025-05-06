
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, User } from 'lucide-react';

// Mock data for blog posts
const blogPosts = [
  {
    id: '1',
    title: 'Top 10 Tips for Effective Video Editing',
    excerpt: 'Learn the essential tips and tricks that professional video editors use to create stunning videos.',
    category: 'Editing Tips',
    date: 'June 10, 2023',
    author: 'Sarah Johnson',
    authorAvatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1574717024453-354056aafa98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80'
  },
  {
    id: '2',
    title: 'Creating Cinematic Transitions for Your Videos',
    excerpt: 'Discover how to add cinematic transitions to take your videos to the next level.',
    category: 'Editing Techniques',
    date: 'May 22, 2023',
    author: 'David Miller',
    authorAvatar: 'https://randomuser.me/api/portraits/men/46.jpg',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80'
  },
  {
    id: '3',
    title: 'The Future of Video Editing: AI and Automation',
    excerpt: 'Exploring how artificial intelligence is changing the landscape of video editing.',
    category: 'Industry Trends',
    date: 'April 15, 2023',
    author: 'Emily Chen',
    authorAvatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80'
  },
  {
    id: '4',
    title: 'Color Grading: Techniques for Achieving Professional Looks',
    excerpt: 'Learn how to use color grading to create consistent and professional-looking videos.',
    category: 'Color Grading',
    date: 'March 30, 2023',
    author: 'Alex Wang',
    authorAvatar: 'https://randomuser.me/api/portraits/men/92.jpg',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80'
  }
];

const Blog = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">GigHubify Blog</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Insights, tutorials, and trends from the world of video editing
          </p>
        </div>

        {/* Featured post */}
        <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="h-64 md:h-auto overflow-hidden">
              <img 
                src={blogPosts[0].image} 
                alt={blogPosts[0].title} 
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {blogPosts[0].category}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                {blogPosts[0].title}
              </h2>
              <p className="text-muted-foreground mb-6">
                {blogPosts[0].excerpt}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center">
                  <img 
                    src={blogPosts[0].authorAvatar}
                    alt={blogPosts[0].author}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{blogPosts[0].author}</p>
                    <p className="text-xs text-muted-foreground">{blogPosts[0].date}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{blogPosts[0].readTime}</span>
                </div>
              </div>
              <Link 
                to={`/blog/${blogPosts[0].id}`}
                className="mt-6 flex items-center justify-center w-full py-2 px-4 rounded-md border border-border/80 text-sm font-medium transition-colors hover:bg-accent"
              >
                Read Article
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Blog post grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <div key={post.id} className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle card-hover">
              <div className="h-48 overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center">
                    <img 
                      src={post.authorAvatar}
                      alt={post.author}
                      className="w-8 h-8 rounded-full mr-2 object-cover"
                    />
                    <div>
                      <p className="font-medium text-xs">{post.author}</p>
                      <p className="text-xs text-muted-foreground">{post.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                <Link 
                  to={`/blog/${post.id}`}
                  className="mt-4 flex items-center justify-center w-full py-2 px-4 rounded-md border border-border/80 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Read Article
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter signup */}
        <div className="mt-16 p-8 bg-accent/30 rounded-xl border border-border/50">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Subscribe to Our Newsletter</h2>
            <p className="text-muted-foreground mb-6">
              Get the latest video editing tips, tutorials, and industry insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email"
                placeholder="Enter your email address"
                className="flex-grow px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button className="btn-primary whitespace-nowrap">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;
