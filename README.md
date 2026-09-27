# GitHub Project Hosting Studio

ফোন থেকে GitHub repository-তে বড় HTML/CSS/JS static project ZIP upload করার browser-only panel।

## ব্যবহার

1. GitHub-এ একটি repository তৈরি করুন।
2. Repository-এর জন্য Contents: write permission-সহ একটি authentication token ব্যবহার করুন।
3. এই project-এর `index.html` GitHub Pages-এ publish করুন।
4. Panel-এ token, owner, repo ও branch দিন।
5. ZIP নির্বাচন করুন।
6. `ZIP → GitHub Upload` চাপুন।
7. GitHub Pages-এ publish হলে website URL পাওয়া যাবে।

## ZIP উদাহরণ

website.zip
├── index.html
├── style.css
├── app.js
├── css/
├── js/
├── images/
└── assets/

## নিরাপত্তা

Token source code-এর মধ্যে রাখা হয়নি। Browser session memory-তে token রাখা হয়। Public repository-তে token commit করবেন না।

## গুরুত্বপূর্ণ সীমাবদ্ধতা

GitHub Pages static hosting। PHP/Python/Node.js backend চলবে না। Firebase REST/SDK, public APIs এবং client-side JavaScript ব্যবহার করা static project চলতে পারে, যদি তাদের নিজস্ব security/CORS/config ঠিক থাকে।

Browser uploader ZIP খুলতে fflate CDN ব্যবহার করে। Internet connection প্রয়োজন।

GitHub API এবং GitHub repository-এর নিজস্ব file/commit/rate limits প্রযোজ্য।
