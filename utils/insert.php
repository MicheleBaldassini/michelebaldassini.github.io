<?php

header('Access-Control-Allow-Origin: https://michelebaldassini.github.io');
header('Access-Control-Allow-Credentials: true');
header('Content-type: application/json');


require_once 'tidyHTML.php';
require_once 'templates.php';


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
    $html = $tidy->BeautifiedHTML();

    $html = preg_replace('/="([^"]*)"/', "='$1'", $html);
    return $html;
}


function updateJSON($section, $link) {
    $jsonData = readFileContent('../index.json');
    $data = json_decode($jsonData, true);

    $id = formatID($link);

    if ($page == 'talks' || $page == 'awards')
        $title = str_replace('_', ' ', $link);
    else
        $title = formatTitle($link);

    if ($section == 'publications' || $section == 'experience')
        $link = $section . '/#' . $id;
    else if ($section == 'talks' || $section == 'awards' || $section == 'patents')
        $link = 'talks_and_awards/#' . $id;
    else if ($section == 'teaching')
        $link = $section . '/' . $link . '/';
    else
        $link = '#' . $id;

    $newElement = [
        'title' => $title,
        'info' => 'info XXX',
        'section' => $section,
        'link' => 'https://michelebaldassini.github.io/' . $link
    ];

    // $lastPubIndex = -1;
    // foreach ($data as $index => $entry) {
    //     if ($entry['section'] === $section) {
    //         $lastPubIndex = $index;
    //     }
    // }

    // if ($lastPubIndex !== -1) {
    //     array_splice($data, $lastPubIndex + 1, 0, [$newElement]);
    // } else {
    //     $data[] = $newElement;
    // }
    $firstMatchIndex = -1;
    foreach ($data as $index => $entry) {
        if ($entry['section'] === $section) {
            $firstMatchIndex = $index;
            break;
        }
    }

    if ($firstMatchIndex !== -1) {
        array_splice($data, $firstMatchIndex, 0, [$newElement]);
    } else {
        // $data[] = $newElement;
        array_unshift($data, $newElement);
    }

    writeFileContent('../index.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
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

    if ($page == 'experience') {
        $experiencePage = readFileContent($EXPERIENCE_PATH);

        $id = formatID($link);
        
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($experiencePage, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $existingExperience = $xpath->query("//div[@id='" . $id . "']");

        if ($existingExperience->length > 0) {
            $response = array('error' => true, 'message' => 'Experience ' . $link . ' already exists.');
            echo json_encode($response);
            exit(1);
        }

        $mainTimeline = $xpath->query("//div[contains(@class, 'main-timeline')]")->item(0);

        $experience = template_experience($dom, $link);
        $firstChild = $mainTimeline->firstChild;
        $mainTimeline->insertBefore($experience, $firstChild);

        $experiencePage = $dom->saveHTML();
        $experiencePage = updateDate($experiencePage, $updated);
        $experiencePage = indentHTML($experiencePage);
        $experiencePage = replaceApex($experiencePage);
        writeFileContent($EXPERIENCE_PATH, $experiencePage);

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $id = formatID($link);
        $existingExperience = $xpath->query("//div[@id='" . $id . "']");

        if ($existingExperience->length > 0) {
            $response = array('error' => true, 'message' => 'Experience ' . $link . ' already exists.');
            echo json_encode($response);
            exit(1);
        }

        $mainTimeline = $xpath->query("//section[@id='experience']//div[contains(@class, 'main-timeline')]")->item(0);

        $experience = template_experience($dom, $link);
        $firstChild = $mainTimeline->firstChild;
        $mainTimeline->insertBefore($experience, $firstChild);

        $indexHtml = $dom->saveHTML();
        $indexHtml = updateDate($indexHtml, $updated);
        $indexHtml = indentHTML($indexHtml);
        $indexHtml = replaceApex($indexHtml);
        writeFileContent($INDEX_PATH, $indexHtml);

        updateJSON($page, $link);

    } else if ($page == 'teaching') {

        $title = formatTitle($link);

        if (file_exists($TEACHING_PATH . '/' . $link . '/index.html')) {
            $response = array('error' => true, 'message' => 'Teaching ' . $link . ' already exists.');
            echo json_encode($response);
            exit(1);
        } else {
           mkdir($TEACHING_PATH . '/' . $link);
        }

        // foreach (glob("$TEACHING_PATH/*/index.html") as $pagePath) {
        //     $teachingHtml = readFileContent($pagePath);
        //     $teachingHtml = str_replace("<ul class='nav sidenav'>",
        //                                 "<ul class='nav sidenav'>
        //                                     <li class='nav-item'>
        //                                         <a class='nav-link ext-link' href='../" . $link . "'>" . $title . "</a>
        //                                     </li>",
        //                                 $teachingHtml);
        //     $teachingHtml = str_replace("<div id='dropdownResponsive' class='dropdown-menu' aria-labelledby='navbarDropdown'>",
        //                                 "<div id='dropdownResponsive' class='dropdown-menu' aria-labelledby='navbarDropdown'>
        //                                     <a class='dropdown-item' href='../" . $link . "'>" . $title . "</a>",
        //                                 $teachingHtml);

        //     $teachingHtml = updateDate($teachingHtml, $updated);
        //     $teachingHtml = indentHTML($teachingHtml);
        //     $teachingHtml = replaceApex($teachingHtml);
        //     writeFileContent($pagePath, $teachingHtml);
        // }
        foreach (glob("$TEACHING_PATH/*/index.html") as $pagePath) {
            $teachingHtml = readFileContent($pagePath);

            $dom = new DOMDocument();
            libxml_use_internal_errors(true);
            $dom->loadHTML($teachingHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
            libxml_clear_errors();

            $xpath = new DOMXPath($dom);

            $sidenav = $xpath->query("//ul[@class='nav sidenav']")->item(0);
            if ($sidenav) {
                $li = $dom->createElement('li');
                $li->setAttribute('class', 'nav-item');

                $a = $dom->createElement('a', $title);
                $a->setAttribute('class', 'nav-link ext-link');
                $a->setAttribute('href', '../' . $link . '/');

                $li->appendChild($a);
                $sidenav->insertBefore($li, $sidenav->firstChild);
            }

            $dropdown = $xpath->query("//div[@id='dropdownResponsive' and contains(@class, 'dropdown-menu')]")->item(0);
            if ($dropdown) {
                $a = $dom->createElement('a', $title);
                $a->setAttribute('class', 'dropdown-item nav-link ext-link');
                $a->setAttribute('href', '../' . $link . '/');
                $dropdown->insertBefore($a, $dropdown->firstChild);
            }

            $teachingHtml = $dom->saveHTML();
            $teachingHtml = updateDate($teachingHtml, $updated);
            $teachingHtml = indentHTML($teachingHtml);
            $teachingHtml = replaceApex($teachingHtml);
            writeFileContent($pagePath, $teachingHtml);
        }

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $firstTeachingUrl = $xpath->query("//section[@id='teaching']//a[contains(@class, 'ext-link')]")->item(0);
        $firstTeachingUrl = $firstTeachingUrl->getAttribute('href');

        $firstTeachingPath = ltrim($firstTeachingUrl, '/');

        $mainTimeline = $xpath->query("//section[@id='teaching']//div[contains(@class, 'main-timeline')]")->item(0);
        
        $teaching = template_teaching($dom, $link, 'home');
        $firstChild = $mainTimeline->firstChild;
        $mainTimeline->insertBefore($teaching, $firstChild);

        $indexHtml = $dom->saveHTML();
        $indexHtml = updateDate($indexHtml, $updated);
        $indexHtml = indentHTML($indexHtml);
        $indexHtml = replaceApex($indexHtml);
        writeFileContent($INDEX_PATH, $indexHtml);

        $teachingHtml = readFileContent('../teaching/index.html');
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($teachingHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        $mainTimeline = $xpath->query(".//div[contains(@class, 'main-timeline')]")->item(0);

        $teaching = template_teaching($dom, $link, 'teaching');
        $firstChild = $mainTimeline->firstChild;
        $mainTimeline->insertBefore($teaching, $firstChild);

        $teachingHtml = $dom->saveHTML();
        $teachingHtml = updateDate($teachingHtml, $updated);
        $teachingHtml = indentHTML($teachingHtml);
        $teachingHtml = replaceApex($teachingHtml);
        writeFileContent('../teaching/index.html', $teachingHtml);

        $experienceHtml = readFileContent($EXPERIENCE_PATH);
        $experienceHtml = str_replace('../' . $firstTeachingPath, '../teaching/' . $link . '/', $experienceHtml);
        
        $experienceHtml = updateDate($experienceHtml, $updated);

        $experienceHtml = indentHTML($experienceHtml);
        $experienceHtml = replaceApex($experienceHtml);
        writeFileContent($EXPERIENCE_PATH, $experienceHtml);
        
        $publicationsHtml = readFileContent($PUBLICATIONS_PATH);
        $publicationsHtml = str_replace('../' . $firstTeachingPath, '../teaching/' . $link . '/', $publicationsHtml);
        
        $publicationsHtml = updateDate($publicationsHtml, $updated);

        $publicationsHtml = indentHTML($publicationsHtml);
        $publicationsHtml = replaceApex($publicationsHtml);
        writeFileContent($PUBLICATIONS_PATH, $publicationsHtml);

        $talksHtml = readFileContent($TALKS_PATH);
        $talksHtml = str_replace('../' . $firstTeachingPath, '../teaching/' . $link . '/', $talksHtml);
        
        $talksHtml = updateDate($talksHtml, $updated);

        $talksHtml = indentHTML($talksHtml);
        $talksHtml = replaceApex($talksHtml);
        writeFileContent($TALKS_PATH, $talksHtml);

        $newTeachingPage = readFileContent('../' . $firstTeachingPath . '/index.html');

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($newTeachingPage, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        $sidenav = $xpath->query("//ul[@class='nav sidenav']")->item(0);

        $firstListItem = $sidenav->getElementsByTagName('li')->item(0);
        $firstListItem->setAttribute('class', 'nav-item active');
        $firstAnchor = $firstListItem->getElementsByTagName('a')->item(0);
        $firstAnchor->setAttribute('class', 'nav-link');
        $firstAnchor->setAttribute('href', 'javascript:void(0);');

        $secondListItem = $sidenav->getElementsByTagName('li')->item(1);
        $secondListItem->setAttribute('class', 'nav-item');
        $secondAnchor = $secondListItem->getElementsByTagName('a')->item(0);
        $secondAnchor->setAttribute('class', 'nav-link ext-link');
        $secondAnchor->setAttribute('href', '../' . end(explode('/', rtrim($firstTeachingPath, '/'))) . '/');

        $dropdown = $xpath->query("//div[@id='dropdownResponsive' and contains(@class, 'dropdown-menu')]")->item(0);

        $firstAnchor = $dropdown->getElementsByTagName('a')->item(0);
        $firstAnchor->setAttribute('class', 'dropdown-item nav-link active');
        $firstAnchor->setAttribute('href', 'javascript:void(0);');

        $secondAnchor = $dropdown->getElementsByTagName('a')->item(1);
        $secondAnchor->setAttribute('class', 'dropdown-item nav-link ext-link');
        $secondAnchor->setAttribute('href', '../' . end(explode('/', rtrim($firstTeachingPath, '/'))) . '/');

        $teachingNameDiv = $xpath->query("//div[contains(@class, 'teaching-name')]")->item(0);
        if ($teachingNameDiv) {
            $foundSvg = false;
            foreach ($teachingNameDiv->childNodes as $child) {
                if ($child->nodeName === 'svg') {
                    $foundSvg = true;
                    continue;
                }

                if ($foundSvg && $child->nodeType === XML_TEXT_NODE) {
                    $child->nodeValue = $title;
                    break;
                }
            }
        }

        $teachingHeader = $xpath->query("//h1[contains(@class, 'teaching-header')]")->item(0);
        $teachingHeader->nodeValue = $title;

        $newTeachingPage = $dom->saveHTML();
        $newTeachingPage = indentHTML($newTeachingPage);
        $newTeachingPage = replaceApex($newTeachingPage);
        writeFileContent($TEACHING_PATH . '/' . $link . '/index.html', $newTeachingPage);

        updateJSON($page, $link);

    } else if ($page == 'publications') {
        $publicationsPage = readFileContent($PUBLICATIONS_PATH);

        # $title = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');
        // $title = str_replace("_", " ", $link);
        // echo $title;
        $id = formatID($link);
        
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($publicationsPage, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $existingPublication = $xpath->query("//div[@id='" . $id . "']");
        # $xpath->query("//h4[@class='article-title' and text()='" . $title . "']");

        if ($existingPublication->length > 0) {
            $response = array('error' => true, 'message' => 'Publication ' . $link . ' already exists.');
            echo json_encode($response);
            exit(1);
        }

        $articlesContainer = $xpath->query("//div[contains(@class, 'articles')]")->item(0);
        $article = template_publications($dom, $link, 'publications');

        if ($articlesContainer->hasChildNodes()) {
            $firstChild = $articlesContainer->firstChild;
            $articlesContainer->insertBefore($article, $firstChild);
        } else {
            $articlesContainer->appendChild($article);
        }

        $publicationsPage = $dom->saveHTML();
        $publicationsPage = updateDate($publicationsPage, $updated);
        $publicationsPage = indentHTML($publicationsPage);
        $publicationsPage = replaceApex($publicationsPage);
        writeFileContent($PUBLICATIONS_PATH, $publicationsPage);

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        $articlesContainer = $xpath->query("//div[contains(@class, 'articles')]")->item(0);
        $article = template_publications($dom, $link, 'home');

        if ($articlesContainer->hasChildNodes()) {
            $firstChild = $articlesContainer->firstChild;
            $articlesContainer->insertBefore($article, $firstChild);
        } else {
            $articlesContainer->appendChild($article);
        }

        $articles = $xpath->query(".//div[contains(@class, 'item')]", $articlesContainer);
        if ($articles->length > 3) {
            $lastArticle = $articles->item($articles->length - 1);
            $parent = $lastArticle->parentNode;
            $parent->removeChild($lastArticle);
        }

        $indexHtml = $dom->saveHTML();
        $indexHtml = updateDate($indexHtml, $updated);
        $indexHtml = indentHTML($indexHtml);
        $indexHtml = replaceApex($indexHtml);
        writeFileContent($INDEX_PATH, $indexHtml);

        updateJSON($page, $link);

    } else if ($page == 'talks' || $page == 'awards' || $page == 'patents') {
        $talksPage = readFileContent($TALKS_PATH);

        $id = formatID($link);

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($talksPage, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);
        $existingTalk = $xpath->query("//div[@id='" . $id . "']");

        if ($existingTalk->length > 0) {
            $response = array('error' => true, 'message' => ucfirst($page) . ' ' . $link . ' already exists.');
            echo json_encode($response);
            exit(1);
        }

        $talksContainer = $xpath->query("//div[contains(@class, 'cards')]")->item(0);
        $talks = template_talks($dom, $link, $page, 'talks');

        if ($talksContainer->hasChildNodes()) {
            $firstChild = $talksContainer->firstChild;
            $talksContainer->insertBefore($talks, $firstChild);
        } else {
            $talksContainer->appendChild($talks);
        }

        $talksPage = $dom->saveHTML();
        $talksPage = updateDate($talksPage, $updated);
        $talksPage = indentHTML($talksPage);
        $talksPage = replaceApex($talksPage);
        writeFileContent($TALKS_PATH, $talksPage);


        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        $talksContainer = $xpath->query("//div[contains(@class, 'cards')]")->item(0);
        $talks = template_talks($dom, $link, $page, 'home');

        if ($talksContainer->hasChildNodes()) {
            $firstChild = $talksContainer->firstChild;
            $talksContainer->insertBefore($talks, $firstChild);
        } else {
            $talksContainer->appendChild($talks);
        }

        $cards = $xpath->query(".//div[contains(@class, 'item')]", $talksContainer);
        if ($cards->length > 2) {
            $lastCard = $cards->item($cards->length - 1);
            $parent = $lastCard->parentNode;
            $parent->removeChild($lastCard);
        }

        $indexHtml = $dom->saveHTML();
        $indexHtml = updateDate($indexHtml, $updated);
        $indexHtml = indentHTML($indexHtml);
        $indexHtml = replaceApex($indexHtml);
        writeFileContent($INDEX_PATH, $indexHtml);

        updateJSON($page, $link);

    // } else if ($page == 'talks' || $page == 'awards') {
    //     $id = formatID($link);

    //     $dom = new DOMDocument();
    //     libxml_use_internal_errors(true);
    //     $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    //     libxml_clear_errors();

    //     $xpath = new DOMXPath($dom);
    //     $existingTalk = $xpath->query("//div[@id='" . $id . "']");

    //     if ($existingTalk->length > 0) {
    //         $response = array('error' => true, 'message' => 'Talk/Award ' . $link . ' already exists.');
    //         echo json_encode($response);
    //         exit(1);
    //     }

    //     $talksContainer = $xpath->query("//section[@id='talks']//div[contains(@class, 'col-12 col-lg-8')]")->item(0);

    //     $talks = template_talks($dom, $link, $page);
    //     $firstChild = $talksContainer->firstChild;
    //     $talksContainer->insertBefore($talks, $firstChild);

    //     $indexHtml = $dom->saveHTML();
    //     $indexHtml = updateDate($indexHtml, $updated);
    //     $indexHtml = indentHTML($indexHtml);
    //     $indexHtml = replaceApex($indexHtml);
    //     writeFileContent($INDEX_PATH, $indexHtml);

    //     updateJSON($page, $link);
    }
}


// $dom = new DOMDocument();
        // libxml_use_internal_errors(true);
        // $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        // libxml_clear_errors();

        // $xpath = new DOMXPath($dom);
        // $id = formatID($link);
        // $existingTalks = $xpath->query("//div[@id='" . $id . "']");

        // if ($existingTalks) {
        //     $response = array('error' => true, 'message' => 'Talks/Awards ' . $link . ' already exists.');
        //     echo json_encode($response);
        //     exit(1);
        // }

        // $mainTimeline = $xpath->query("section[@id='teaching']//div[contains(@class, 'main-timeline')]")->item(0);

        // $experience = template_experience($link);
        // $firstChild = $$mainTimeline->firstChild;
        // $mainTimeline->insertBefore($articleDiv, $firstChild);

        // updateJSON($page, $link);
//     elseif ($page == 'talks') {

//         $title = strtoupper(str_replace('_', ' ', $link));

//         if (file_exists($TALKS_PATH . '/' . $link . '/index.html')) {
//             $response = array('error' => true, 'message' => 'Talk ' . $link . ' already exists.');
//             echo json_encode($response);
//             exit(1);
//         } else {
//             mkdir($TALKS_PATH . '/' . $link, 0777, true);
//         }

//         foreach (glob("$TALKS_PATH/*/index.html") as $pagePath) {
//             $talkHtml = readFileContent($pagePath);
//             $talkHtml = str_replace("<ul class='nav sidenav'>",
//                                     "<ul class='nav sidenav'>
//                                         <li class='nav-item'>
//                                             <a class='nav-link ext-link' href='../" . $link . "'>" . $title . "</a>
//                                         </li>",
//                                     $talkHtml);
//             $talkHtml = str_replace("<div id='dropdownResponsive' class='dropdown-menu' aria-labelledby='navbarDropdown'>",
//                                     "<div id='dropdownResponsive' class='dropdown-menu' aria-labelledby='navbarDropdown'>
//                                         <a class='dropdown-item' href='../" . $link . "'>" . $title . "</a>",
//                                     $talkHtml);

//             $talkHtml = updateDate($talkHtml, $updated);

//             $talkHtml = indentHTML($talkHtml);
//             writeFileContent($pagePath, $talkHtml);
//         }

//         $dom = new DOMDocument();
//         libxml_use_internal_errors(true);
//         $dom->loadHTML($indexHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
//         libxml_clear_errors();

//         $xpath = new DOMXPath($dom);
//         $firstTalksUrl = $xpath->query("//section[@id='talks']//a[contains(@class, 'ext-link')]")->item(0);
//         $firstTalksUrl = $firstTalksUrl->getAttribute('href');

//         $firstTalkPath = ltrim($firstTalksUrl, '/');

//         $indexHtml = updateDate($indexHtml, $updated);

//         $indexHtml = indentHTML($indexHtml);
//         writeFileContent($INDEX_PATH, $indexHtml);

//         $publicationsHtml = readFileContent($PUBLICATIONS_PATH);
//         $publicationsHtml = str_replace('../' . $firstTalkPath, '../talks/' . $link, $publicationsHtml);

//         $publicationsHtml = updateDate($publicationsHtml, $updated);

//         $publicationsHtml = indentHTML($publicationsHtml);
//         writeFileContent($PUBLICATIONS_PATH, $publicationsHtml);

//         foreach (glob("$TEACHING_PATH/*/index.html") as $pagePath) {
//             $teachingHtml = readFileContent($pagePath);
//             $teachingHtml = str_replace('../../' . $firstTalkPath, '../../talks/' . $link, $teachingHtml);

//             $teachingHtml = updateDate($teachingHtml, $updated);

//             $teachingHtml = indentHTML($teachingHtml);
//             writeFileContent($pagePath, $teachingHtml);
//         }

//         $newTalkPage = readFileContent('../' . $firstTalkPath . '/index.html');

//         $dom = new DOMDocument();
//         libxml_use_internal_errors(true);
//         $dom->loadHTML($newTalkPage, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
//         libxml_clear_errors();

//         $xpath = new DOMXPath($dom);

//         $sidenav = $xpath->query("//ul[@class='nav sidenav']")->item(0);

//         $firstListItem = $sidenav->getElementsByTagName('li')->item(0);
//         $firstListItem->setAttribute('class', 'nav-item active');
//         $firstAnchor = $firstListItem->getElementsByTagName('a')->item(0);
//         $firstAnchor->setAttribute('class', 'nav-link');
//         $firstAnchor->setAttribute('href', 'javascript:void(0);');

//         $secondListItem = $sidenav->getElementsByTagName('li')->item(1);
//         $secondListItem->setAttribute('class', 'nav-item');
//         $secondAnchor = $secondListItem->getElementsByTagName('a')->item(0);
//         $secondAnchor->setAttribute('class', 'nav-link ext-link');
//         $secondAnchor->setAttribute('href', '../' . end(explode('/', rtrim($firstTalkPath, '/'))));

//         $dropdown = $xpath->query("//div[@id='dropdownResponsive' and contains(@class, 'dropdown-menu')]")->item(0);

//         $firstAnchor = $dropdown->getElementsByTagName('a')->item(0);
//         $firstAnchor->setAttribute('class', 'dropdown-item active');
//         $firstAnchor->setAttribute('href', 'javascript:void(0);');

//         $secondAnchor = $dropdown->getElementsByTagName('a')->item(1);
//         $secondAnchor->setAttribute('class', 'dropdown-item ext-link');
//         $secondAnchor->setAttribute('href', '../' . end(explode('/', rtrim($firstTalkPath, '/'))));

//         $newTalkPage = $dom->saveHTML();
//         $newTalkPage = indentHTML($newTalkPage, $self_indent=4);
//         writeFileContent($TALKS_PATH . '/' . $link . '/index.html', $newTalkPage);
//     }
// }

?>