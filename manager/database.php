<?php

$hostName = "localhost";
$dbUser = "root";
$dbPassword = "";
$dbName = "manager_login";
$conn = mysqli_connect($hostName, $dbUser, $dbPassword, $dbName);
if (!$conn) {
    die("Something went wrong;");
}

?>