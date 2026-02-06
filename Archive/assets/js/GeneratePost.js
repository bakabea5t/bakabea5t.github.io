// will generate and update posts.json with n number post 
// call with command "node ./assets/js/GeneratePost.js"

const fs = require('fs');

const imageList = [
  "../assets\img\work\work-1.jpg",
  "../assets/img/work/work-2.jpg",
  "../assets/img/work/work-3.jpg",
  "../assets/img/work/work-4.jpg",
  "../assets/img/work/work-5.jpg",
  "../assets/img/work/work-6.jpg",
  "../assets/img/work/work-7.jpg",
  "../assets/img/work/work-8.jpg",
  "../assets/img/work/work-9.jpg",
  "../assets/img/work/work-5.jpg"
];

function getRandomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
}

function getRandomSubset(array, max = 2) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * max) + 1);
}

function getUniqueImages(n) {
  const shuffled = [...imageList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function generatePosts(n = 50) {
  const categories = [
    "Web Development", "UI/UX", "Design", "DevOps", "Security",
    "Linux", "JavaScript", "Python", "Branding", "Portfolio",
    "Automation", "HTML/CSS", "Containers", "Refactoring",
    "APIs", "Freelance", "Responsive Design"
  ];

  const posts = [];

  for (let i = 1; i <= n; i++) {
    const slug = `post-${i}`;
    const images = getUniqueImages(3);

    posts.push({
      title: `Post-${i}`,
      slug,
      categories: getRandomSubset(categories),
      date: getRandomDate(new Date(2021, 0, 1), new Date(2024, 0, 1)),
      author: "John Doe",
      previewImage: images[0],
      link: `posts/${slug}.html`,
      content: "This is the first paragraph. [IMAGE] Here is some more text after the image. [IMAGE] Conclusion of the post.",
      images: images
    });
  }

  return posts;
}

// Generate and write to posts.json
const posts = generatePosts(200);
fs.writeFileSync('posts.json', JSON.stringify(posts, null, 2));
console.log('✅ posts.json created with 200 posts.');
