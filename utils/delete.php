<?php

header('Access-Control-Allow-Origin: https://michelebaldassini.github.io');
header('Access-Control-Allow-Credentials: true');
header('Content-type: application/json');


require_once 'tidyHTML.php';


// Header path location
// define('INDEX_PATH', 'https://michelebaldassini.github.io/index.html');


// Sanitize input to prevent code injection and try to strip HTML tags
$data = filter_field();
$page = $data['page'];
$link = $data['link'];

update($page, $link);

$response = array('error' => false, 'message' => $page . ' updated');
echo json_encode($response);
exit(0);


function filter_field() {

    if (!isset($_GET['pwd']) || empty($_GET['pwd'])) {
        $response = array('error' => true, 'message' => 'Missing password');
        echo json_encode($response);
        exit(1);
    }

    $password = hash('sha512', $_GET['pwd']);

    if ($password !== '83d97b71499bee6b9d42dee9d3a6e5d00ecc8c891346d25d1909b3aac9abaa0ad4864fe4eacf159cd3f4a0ad764178d014ac378dfffc5e4023f6dbcfb0992648') {
        $response = array('error' => true, 'message' => 'Wrong password');
        echo json_encode($response);
        exit(1);
    }

    if (!isset($_GET['page']) || empty($_GET['page'])) {
        $response = array('error' => true, 'message' => 'Missing page');
        echo json_encode($response);
        exit(1);
    }

    if (!isset($_GET['link']) || empty($_GET['link'])) {
        $response = array('error' => true, 'message' => 'Missing link');
        echo json_encode($response);
        exit(1);
    }

    return array('page' => $_GET['page'], 'link' => $_GET['link']);
}


function readFileContent($filePath) {
    $content = '';
    if ($handle = fopen($filePath, 'r')) {
        while (!feof($handle)) {
            $content .= fread($handle, 8192);
        }
        fclose($handle);
    } else {
        $response = array('error' => true, 'message' => 'Unable to read file ' . $filePath);
        echo json_encode($response);
        exit(1);
    }
    return $content;
}


function writeFileContent($filePath, $content) {
    if ($handle = fopen($filePath, 'w')) {
        fwrite($handle, $content);
        fclose($handle);
    } else {
        $response = array('error' => true, 'message' => 'Unable to write to file' . $filePath);
        echo json_encode($response);
        exit(1);
    }
}


function updateDate($html, $updated) {
    return preg_replace("/(<div class='body-footer'>\s*)<p>.*?<\/p>/s",
                        '$1<p>Last updated on ' . $updated . '</p>',
                         $html,
                         1);
}


function indentHTML($html) {
    $tidy = new tidyHTML($html);
    $tidy->SetIndentSize(4);
    $tidy->SetOffset(0);
    return $tidy->BeautifiedHTML();
}


function deleteFolder($folder) {
    if (!is_dir($folder))
        return;

    $files = array_diff(scandir($folder), ['.', '..']);
    
    foreach ($files as $file) {
        $filePath = $folder . '/' . $file;
        if (is_dir($filePath)) {
            deleteFolder($filePath);
        } else {

            unlink($filePath);
        }
    }

    rmdir($folder);
}


// function updateJSON($string) {
//     $jsonData = readFileContent('../index.json');
//     $data = json_decode($jsonData, true);

//     $filteredData = array_filter($data, function ($entry) use ($string) {
//         $lastSlashPos = strrpos($entry['link'], '/'); 
//         $after = substr($entry['link'], $lastSlashPos + 1);
//         $after = ltrim($after, '#');

//         if ($after === $string) {
//             return false;
//         }
//         return true;
//     });

//     $filteredData = array_values($filteredData);
//     writeFileContent('../index.json', json_encode($filteredData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
// }
function updateJSON($string) {
    $jsonData = readFileContent('../index.json');
    $data = json_decode($jsonData, true);

    $filteredData = array_filter($data, function ($entry) use ($string) {
        $link = $entry['link'];

        if (strpos($link, '#') !== false) {
            $after = substr($link, strpos($link, '#') + 1);
        } else {
            $link = rtrim($link, '/');
            $lastSlashPos = strrpos($link, '/');
            $after = $lastSlashPos !== false ? substr($link, $lastSlashPos + 1) : $link;
        }
        return $after !== $string;
    });

    $filteredData = array_values($filteredData);
    writeFileContent('../index.json', json_encode($filteredData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}


function formatID($input) {
    $formatted = str_replace('_', '-', $input);
    $formatted = strtolower($formatted);

    return $formatted;
}


function replaceApex($html) {
    $html = str_replace("Baldassini's", "Baldassini&#39;s", $html);
    $html = str_replace('meta[name=\'theme-color\']', 'meta[name="theme-color"]', $html);
    
    return $html;
}


function update($page, $link) {
    $updated = date('j M Y');

    $INDEX_PATH = '../index.html';
    $PUBLICATIONS_PATH = '../publications/index.html';
    $TEACHING_PATH = '../teaching';
    $TALKS_PATH = '../talks_and_awards/index.html';
    $EXPERIENCE_PATH = '../experience/index.html';

    $indexHtml = readFileContent($INDEX_PATH);

    $id = formatID($link);

    if ($page == 'experience') {

        $experiencePage = readFileContent($EXPERIENCE_PATH);

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($experiencePage, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $row = $xpath->query("//div[@id='$id']");
        if ($row->length > 0) {
            $rowItem = $row->item(0);
            $rowItem->parentNode->removeChild($rowItem);
        } else {
            $response = array('error' => true, 'message' => 'Experience ' . $link . ' does not exists');
            echo json_encode($response);
            exit(1);
        }

        $experiencePage = $dom->saveHTML();
        $experiencePage = updateDate($experiencePage, $updated);
        $experiencePage = indentHTML($experiencePage);
        writeFileContent($EXPERIENCE_PATH, $experiencePage);

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $section = $xpath->query("//section[@id='experience']")->item(0);
        $row = $xpath->query(".//div[@id='$id']", $section);
        if ($row->length > 0) {
            $rowItem = $row->item(0);
            $rowItem->parentNode->removeChild($rowItem);
        } // else {
        //     $response = array('error' => true, 'message' => 'Experience ' . $link . ' does not exists');
        //     echo json_encode($response);
        //     exit(1);
        // }

        $indexHtml = $dom->saveHTML();
        $indexHtml = updateDate($indexHtml, $updated);
        $indexHtml = indentHTML($indexHtml);
        writeFileContent($INDEX_PATH, $indexHtml);

        updateJSON($id);
    } elseif ($page == 'teaching') {

        if (!file_exists($TEACHING_PATH . '/' . $link . '/index.html')) {
            $response = array('error' => true, 'message' => 'Teaching ' . $link . ' does not exists');
            echo json_encode($response);
            exit(1);
        } else {
           deleteFolder($TEACHING_PATH . '/' . $link);
        }

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $section = $xpath->query("//section[@id='teaching']")->item(0);
        // $timeline = $xpath->query(".//div[@class='timeline']", $section);

        // foreach ($timeline as $row) {
        //     $block = $xpath->query(".//a[@class='ext-link' and contains(@href, 'teaching/$link')]", $row);
        //     if ($block->length > 0) {
        //         $row->parentNode->removeChild($row);
        //         break;
        //     }
        // }
        // $target = $xpath->query(".//div[@class='timeline'][.//a[contains(@href, 'teaching/$link')]]", $section)->item(0);
        $target = $xpath->query("//div[@class='item' and @id='$id']")->item(0);
        $target->parentNode->removeChild($target);

        $indexHtml = $dom->saveHTML();
        $indexHtml = updateDate($indexHtml, $updated);
        $indexHtml = indentHTML($indexHtml);
        writeFileContent($INDEX_PATH, $indexHtml);

        $firstTeachingUrl = $xpath->query("//section[@id='teaching']//a[contains(@class, 'ext-link')]")->item(0);
        $firstTeachingUrl = $firstTeachingUrl->getAttribute('href');

        $firstTeachingPath = ltrim($firstTeachingUrl, '/');


        foreach (glob("$TEACHING_PATH/*/index.html") as $pagePath) {
            $teachingHtml = readFileContent($pagePath);
            $teachingDOM = new DOMDocument();
            libxml_use_internal_errors(true);
            $teachingDOM->loadHTML($teachingHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            libxml_clear_errors();

            $teachingXpath = new DOMXPath($teachingDOM);
            $nodes = $teachingXpath->query(".//a[@href='../$link/']");

            if ($nodes->length > 0) {
                foreach ($nodes as $node) {
                    $parent = $node->parentNode;
                    if ($parent->nodeName === 'li') {
                        $parent->parentNode->removeChild($parent);
                    } else {
                        $parent->removeChild($node);
                    }
                }
            }

            $teachingHtml = $teachingDOM->saveHTML();
            $teachingHtml = updateDate($teachingHtml, $updated);
            $teachingHtml = indentHTML($teachingHtml);
            $teachingHtml = replaceApex($teachingHtml); //'/="([^"]*)"/', "='$1'", $teachingHtml);
            
            writeFileContent($pagePath, $teachingHtml);
        }

        $teachingHtml = readFileContent('../teaching/index.html');
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($teachingHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        // $section = $xpath->query("//section[@id='teaching']")->item(0);
        // $timeline = $xpath->query(".//div[@class='timeline']", $section);

        // foreach ($timeline as $row) {
        //     $block = $xpath->query(".//a[@class='ext-link' and contains(@href, 'teaching/$link')]", $row);
        //     if ($block->length > 0) {
        //         $row->parentNode->removeChild($row);
        //         break;
        //     }
        // }
        //$target = $xpath->query(".//div[@class='timeline'][.//a[contains(@href, 'teaching/$link')]]")->item(0);
        $target = $xpath->query("//div[@class='item' and @id='$id']")->item(0);
        $target->parentNode->removeChild($target);

        $teachingHtml = $dom->saveHTML();
        $teachingHtml = updateDate($teachingHtml, $updated);
        $teachingHtml = indentHTML($teachingHtml);
        writeFileContent('../teaching/index.html', $teachingHtml);

        $experienceHtml = readFileContent($EXPERIENCE_PATH);
        $experienceHtml = str_replace('../teaching/' . $link . '/', '../' . $firstTeachingPath, $experienceHtml);
        
        $experienceHtml = updateDate($experienceHtml, $updated);

        $experienceHtml = indentHTML($experienceHtml);
        writeFileContent($EXPERIENCE_PATH, $experienceHtml);

        $publicationsHtml = readFileContent($PUBLICATIONS_PATH);
        $publicationsHtml = str_replace('../teaching/' . $link  . '/', '../' . $firstTeachingPath, $publicationsHtml);
        
        $publicationsHtml = updateDate($publicationsHtml, $updated);

        $publicationsHtml = indentHTML($publicationsHtml);
        writeFileContent($PUBLICATIONS_PATH, $publicationsHtml);

        $talksHtml = readFileContent($TALKS_PATH);
        $talksHtml = str_replace('../teaching/' . $link  . '/', '../' .  $firstTeachingPath, $talksHtml);
        
        $talksHtml = updateDate($talksHtml, $updated);

        $talksHtml = indentHTML($talksHtml);
        writeFileContent($TALKS_PATH, $talksHtml);

        updateJSON($link);

    } elseif ($page == 'publications') {

        $publicationsHtml = readFileContent($PUBLICATIONS_PATH);

        libxml_use_internal_errors(true);
        libxml_clear_errors();
        $dom = new DOMDocument();
        $dom->loadHTML($publicationsHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $xpath = new DOMXPath($dom);

        $articles = $xpath->query("//div[contains(@class, 'isotope-item')]");

        $removedIndex = -1;
        $count = 0;
        foreach ($articles as $article) {
            if ($article->nodeType !== XML_ELEMENT_NODE) {
                continue;
            }
            if ($article->getAttribute('id') == $id) {
                $removedIndex = $count;
                $parent = $article->parentNode;
                $parent->removeChild($article);
                break;
            }
            $count++;
        }

        if ($removedIndex == -1) {
            $response = array('error' => true, 'message' => 'Publications ' . $link . ' does not exists');
            echo json_encode($response);
            exit(1);
        }

        $publicationsHtml = $dom->saveHTML();
        $publicationsHtml = updateDate($publicationsHtml, $updated);
        $publicationsHtml = indentHTML($publicationsHtml);
        writeFileContent($PUBLICATIONS_PATH, $publicationsHtml);

        $articlesUpdated = $xpath->query("//div[contains(@class, 'isotope-item')]");

        libxml_use_internal_errors(true);
        libxml_clear_errors();
        $dom = new DOMDocument();
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $xpath = new DOMXPath($dom);

        if ($count < 5) {
            $recentContainer = $xpath->query("//div[contains(@class, 'articles')]")->item(0);

            $max = min(5, $articlesUpdated->length);
            for ($i = 0; $i < $max; $i++) {
                $articleNode = $articlesUpdated->item($i);
                $importedArticle = $dom->importNode($articleNode, true);
                $recentContainer->appendChild($importedArticle);
            }

            $existingArticles = $xpath->query(".//div[@class='item']", $recentContainer);
            # $allArticles = $xpath->query(".//div[@class='all-article']", $recentContainer);
    
            foreach ($existingArticles as $index => $existingArticle) {
                $recentContainer->removeChild($existingArticle);
            }

            $allArticle = $xpath->query(".//div[@class='all-article']", $recentContainer)->item(0);

            $recentContainer->removeChild($allArticle);
            $recentContainer->appendChild($allArticle);

            $existingArticles = $xpath->query("//div[contains(@class, 'isotope-item')]");
            foreach ($existingArticles as $index => $existingArticle) {
                $existingArticle->setAttribute('class', 'item');   
            }

            $indexHtml = $dom->saveHTML();
            $indexHtml = updateDate($indexHtml, $updated);
            $indexHtml = indentHTML($indexHtml);
            writeFileContent($INDEX_PATH, $indexHtml);
        }

        updateJSON($id);

    } else if ($page == 'talks' || $page == 'awards' || $page == 'patents') {

        $talksHtml = readFileContent($TALKS_PATH);

        libxml_use_internal_errors(true);
        libxml_clear_errors();
        $dom = new DOMDocument();
        $dom->loadHTML($talksHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $xpath = new DOMXPath($dom);

        $cards = $xpath->query("//div[contains(@class, 'isotope-item')]");

        $removedIndex = -1;
        $count = 0;
        foreach ($cards as $card) {
            if ($card->nodeType !== XML_ELEMENT_NODE) {
                continue;
            }
            if ($card->getAttribute('id') == $id) {
                $removedIndex = $count;
                $parent = $card->parentNode;
                $parent->removeChild($card);
                break;
            }
            $count++;
        }

        if ($removedIndex == -1) {
            $response = array('error' => true, 'message' => ucfirst($page) . ' ' . $link . ' does not exists');
            echo json_encode($response);
            exit(1);
        }

        $talksHtml = $dom->saveHTML();
        $talksHtml = updateDate($talksHtml, $updated);
        $talksHtml = indentHTML($talksHtml);
        writeFileContent($TALKS_PATH, $talksHtml);

        $cardsUpdated = $xpath->query("//div[contains(@class, 'isotope-item')]");

        libxml_use_internal_errors(true);
        libxml_clear_errors();
        $dom = new DOMDocument();
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $xpath = new DOMXPath($dom);

        if ($count < 3) {
            $recentContainer = $xpath->query("//div[contains(@class, 'cards')]")->item(0);

            $max = min(3, $cardsUpdated->length);
            for ($i = 0; $i < $max; $i++) {
                $cardNode = $cardsUpdated->item($i);
                $importedCard = $dom->importNode($cardNode, true);
                $recentContainer->appendChild($importedCard);
            }

            $existingCards = $xpath->query(".//div[@class='item']", $recentContainer);
            # $allArticles = $xpath->query(".//div[@class='all-article']", $recentContainer);
    
            foreach ($existingCards as $index => $existingCard) {
                $recentContainer->removeChild($existingCard);
            }

            $allArticle = $xpath->query(".//div[@class='all-article']", $recentContainer)->item(0);

            $recentContainer->removeChild($allArticle);
            $recentContainer->appendChild($allArticle);

            $existingCards = $xpath->query(".//div[contains(@class, 'isotope-item')]");
            foreach ($existingCards as $index => $existingCard) {
                $existingCard->setAttribute('class', 'item');   
            }

            $indexHtml = $dom->saveHTML();
            $indexHtml = updateDate($indexHtml, $updated);
            $indexHtml = indentHTML($indexHtml);
            writeFileContent($INDEX_PATH, $indexHtml);
        }

        updateJSON($id);
    }
            
    // } else if ($page == 'talks' || $page == 'awards') {

    //     $id = formatID($link);

    //     $dom = new DOMDocument();
    //     libxml_use_internal_errors(true);
    //     $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    //     libxml_clear_errors();

    //     $xpath = new DOMXPath($dom);
    //     $section = $xpath->query("//section[@id='talks']")->item(0);
    //     $row = $xpath->query(".//div[@id='$id']", $section);
    //     if ($row->length > 0) {
    //         $rowItem = $row->item(0);
    //         $rowItem->parentNode->removeChild($rowItem);
    //     } else {
    //         $response = array('error' => true, 'message' => 'Talk ' . $link . ' does not exists');
    //         echo json_encode($response);
    //         exit(1);
    //     }

    //     $indexHtml = $dom->saveHTML();
    //     $indexHtml = updateDate($indexHtml, $updated);
    //     $indexHtml = indentHTML($indexHtml);
    //     writeFileContent($INDEX_PATH, $indexHtml);

    //     updateJSON($id);


}

?>