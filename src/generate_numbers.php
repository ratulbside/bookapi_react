<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

$numbers = [];

// Generate 50 random numbers on button click
if (isset($_POST['generate'])) {
  for ($i = 0; $i < 50; $i++) {
    $numbers[$i] = rand(1, 100);
  }
  echo json_encode($numbers);
}

// Multiply each number by 2 with 1 second interval
if (isset($_POST['multiply'])) {
  $data = json_decode($_POST['data']);
  foreach ($data as &$number) {
    sleep(1);
    $number *= 2;
    echo "data: " . json_encode([$number]) . "\n\n";
    ob_flush();
  }
  exit;
}