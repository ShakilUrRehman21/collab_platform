<?php
session_start();
if (!isset($_SESSION["user"])) {
   header("Location: login.php");
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manager</title>
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="../style.css">
  <style>
    .login{
      margin-left:85%;
    }
    img{
      margin-top:3%;
      margin-left:5%;
      margin-bottom: 5%;
    }
    h3{
      margin-top: 5%;
      font-size: 50px;
    }
    .center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
}
  </style>
</head>
<body>
  <header>
    <nav>
        <div class="navbar">
            <ul class="nav-links">
            <li><a href="../task_manage/login.php">Monitor</a></li>
            <div class="login">
            <a href="logout.php" class="btn btn-warning">Logout</a>
              </div>
          </ul>
        </div>
      </nav>
  </header>
<div class="content">
  <h3>Monitor Your assigned tasks</h3>
<img src="../monitor.jpg" class="center">
</div>
  <footer>
    <div class="ft-containter">
      <p>&copy; 2024 Shakil. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
