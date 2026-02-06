function generateHTML(post) {
  const bodyContent = injectImages(post.content, post.images.slice(1)); // Skip leading image
  const leadingImage = post.images[0] || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${post.title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../assets/css/bootstrap.css">
  <link rel="stylesheet" href="../assets/css/virtual.css">
  <link rel="stylesheet" href="../assets/css/topbar.virtual.css">
  <style>
    .back-arrow {
      position: fixed;
      top: 80px;
      left: 20px;
      font-size: 24px;
      cursor: pointer;
      z-index: 999;
    }
  </style>
</head>
<body class="theme-blue" style="padding-top: 70px;">
  <!-- Navbar -->
  <div class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
    <div class="container">
      <a href="/" class="navbar-brand">Jaden Vaught's Portfolio</a>
      <button class="navbar-toggler" data-toggle="collapse" data-target="#main-navbar">
        <span class="ti-menu"></span>
      </button>
      <div class="collapse navbar-collapse" id="main-navbar">
        <ul class="navbar-nav ml-auto">
          <li class="nav-item"><a href="/" class="nav-link">About</a></li>
          <li class="nav-item"><a href="blog-topbar.html" class="nav-link">Portfolio</a></li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Back Arrow -->
  <div class="back-arrow" onclick="window.history.back();">&#8592;</div>

  <!-- Blog Post Content -->
  <div class="container mt-5 pt-4">
    <div class="row">
      <div class="col-md-12">
        <div class="d-flex flex-wrap align-items-center mb-4">
          ${leadingImage ? `<img src="${leadingImage}" class="rounded mr-3" style="width:250px;object-fit:cover;" alt="Featured image">` : ''}
          <div>
            <h1 class="text-primary">${post.title}</h1>
            <div class="text-muted small">By ${post.author} on ${post.date}</div>
          </div>
        </div>
        ${bodyContent}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="vg-footer bg-dark mt-5">
    <h1 class="text-center">Info</h1>
    <div class="container">
      <div class="row">
        <div class="col-md-6 col-lg-3 py-3">
          <div class="float-lg-right">
            <p>Contact me</p>
            <hr class="divider">
            <ul class="list-unstyled">
              <li>jaden.vaught@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- JS Scripts -->
  <script src="../assets/js/jquery-3.5.1.min.js"></script>
  <script src="../assets/js/bootstrap.bundle.min.js"></script>
  <script src="../assets/js/topbar-virtual.js"></script>
</body>
</html>`;
}
