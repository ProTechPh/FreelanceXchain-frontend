import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

interface Post {
  id: string;
  title: string;
  summary: string;
  label: string;
  author: string;
  published: string;
  url: string;
  image: string;
}

interface Blog7Props {
  tagline?: string;
  heading?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  posts?: Post[];
}

const Blog7 = ({
  tagline = "Latest Updates",
  heading = "Blog Posts",
  description = "Discover the latest trends, tips, and best practices in freelancing, blockchain technology, and the future of work.",
  buttonText = "View all articles",
  buttonUrl = "/blog",
  posts = [
    {
      id: "post-1",
      title: "How Smart Contracts Are Revolutionizing Freelance Payments",
      summary:
        "Explore how Ethereum smart contracts eliminate payment disputes and ensure freelancers get paid on time. Learn about our escrow system and milestone-based releases.",
      label: "Blockchain",
      author: "FreelanceX Team",
      published: "15 Jun 2026",
      url: "#",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80",
    },
    {
      id: "post-2",
      title: "Building Your On-Chain Reputation: A Complete Guide",
      summary:
        "Your reputation is your most valuable asset. Learn how our on-chain reputation system works and how to build a trustworthy profile that attracts top employers.",
      label: "Guide",
      author: "FreelanceX Team",
      published: "10 Jun 2026",
      url: "#",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
    },
    {
      id: "post-3",
      title: "AI-Powered Matching: Finding Your Perfect Project",
      summary:
        "Our AI analyzes your skills, experience, and preferences to match you with the ideal projects. Discover how machine learning is transforming the freelance marketplace.",
      label: "AI",
      author: "FreelanceX Team",
      published: "5 Jun 2026",
      url: "#",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    },
  ],
}: Blog7Props) => {
  return (
    <section className="py-32">
      <div className="container mx-auto flex flex-col items-center gap-16 lg:px-16">
        <div className="text-center">
          <Badge variant="secondary" className="mb-6">
            {tagline}
          </Badge>
          <h2 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
            {heading}
          </h2>
          <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
            {description}
          </p>
          <Button variant="link" className="w-full sm:w-auto" asChild>
            <a href={buttonUrl}>
              {buttonText}
              <ArrowRight className="ml-2 size-4" />
            </a>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {posts.map((post) => (
            <Card key={post.id} className="grid grid-rows-[auto_auto_1fr_auto]">
              <div className="aspect-[16/9] w-full">
                <a
                  href={post.url}
                  className="transition-opacity duration-200 fade-in hover:opacity-70"
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover object-center"
                  />
                </a>
              </div>
              <CardHeader>
                <h3 className="text-lg font-semibold hover:underline md:text-xl">
                  <a href={post.url}>
                    {post.title}
                  </a>
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{post.summary}</p>
              </CardContent>
              <CardFooter>
                <a
                  href={post.url}
                  className="flex items-center text-foreground hover:underline"
                >
                  Read more
                  <ArrowRight className="ml-2 size-4" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Blog7 };
