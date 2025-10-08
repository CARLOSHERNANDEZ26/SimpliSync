import React, { useState } from "react";
import PostItem from "../components/PostItem";


const CommunityPosts = () => {

  const [posts] = useState([
    {
      id: 1,
      title: "Tree Planting Event",
      content: "Join us this Saturday for a tree planting event near the park! We'll have food trucks and music.",
      author: "Admin",
      // Using the three specific local/relative image paths you requested
      imageUrls: [
        "/images/planting_event.jpg",
        "/images/planting_event2.jpg",
        "images/planting_event3.jpg",
      ],
    },
    {
      id: 2,
      title: "Gardening Tips",
      content: "Remember to water your plants in the early morning for best results.",
      author: "Jane Doe",
      // FIX: Using the two specific local/relative image paths you requested
      imageUrls: [
        "/images/planting_tips.jpg",
        "/images/planting_tips2.jpg",
      ],
    },
  ]);
  console.log(posts);

  return (
    <div>
      <h2>Community Posts</h2>
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
};

export default CommunityPosts;
