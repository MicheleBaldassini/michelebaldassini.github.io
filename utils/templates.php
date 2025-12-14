<?php

function formatID($input) {
    $formatted = str_replace('_', '-', $input);
    $formatted = strtolower($formatted);

    return $formatted;
}


function formatTitle($input) {
    $formatted = str_replace('_', ' ', $input);
    $formatted = ucwords(strtolower($formatted));

    $lowercaseWords = ['and', 'of', 'the', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an', 'by'];

    $words = explode(' ', $formatted);
    foreach ($words as $index => $word) {
        if ($index > 0 && in_array(strtolower($word), $lowercaseWords)) {
            $words[$index] = strtolower($word);
        }
    }
    return implode(' ', $words);
}


function template_experience($dom, $input) {

    $id = formatID($input);
    $title = formatTitle($input);

    // .main-timeline > .timeline
    $item = $dom->createElement('div');
    $item->setAttribute('class', 'item');
    $item->setAttribute('id', $id);
    $item->setAttribute('tabindex', '0');

    $timelineWrapper = $dom->createElement('div');
    $timelineWrapper->setAttribute('class', 'timeline-wrapper fade-up');

    $timeline = $dom->createElement('div');
    $timeline->setAttribute('class', 'timeline');

    // .timeline > .icon
    $icon = $dom->createElement('div');
    $icon->setAttribute('class', 'timeline-icon');
    $timeline->appendChild($icon);

    // .timeline > .timeline-content > h5.title + p.description
    $content = $dom->createElement('div');
    $content->setAttribute('class', 'timeline-content');

    $titleElement = $dom->createElement('h5', $title);
    $titleElement->setAttribute('class', 'title');
    $content->appendChild($titleElement);

    $desc = $dom->createElement('p', 'Description XXX');
    $desc->setAttribute('class', 'description');
    $content->appendChild($desc);

    // .timeline > .date-content > .date-outer > .date > .inner-date
    $dateContent = $dom->createElement('div');
    $dateContent->setAttribute('class', 'date-content');

    $dateOuter = $dom->createElement('div');
    $dateOuter->setAttribute('class', 'date-outer');

    $date = $dom->createElement('div');
    $date->setAttribute('class', 'date');

    // .date > .inner-date.month
    $month = $dom->createElement('div', 'Duration XXX');
    $month->setAttribute('class', 'inner-date month');
    $date->appendChild($month);

    // .date > .inner-date (start date)
    $startDiv = $dom->createElement('div', 'Start XXX' . ' -');
    $startDiv->setAttribute('class', 'inner-date');
    $date->appendChild($startDiv);

    // .date > .inner-date (end date)
    $endDiv = $dom->createElement('div', 'End XXX');
    $endDiv->setAttribute('class', 'inner-date');
    $date->appendChild($endDiv);

    $dateOuter->appendChild($date);
    $dateContent->appendChild($dateOuter);

    $timeline->appendChild($dateContent);
    $timeline->appendChild($content);

    $timelineWrapper->appendChild($timeline);
    $item->appendChild($timelineWrapper);

    return $item;
}


function template_teaching($dom, $input, $page) {
    $id = formatID($input);
    $title = formatTitle($input);

    $item = $dom->createElement('div');
    $item->setAttribute('class', 'item');
    $item->setAttribute('id', $id);
    $item->setAttribute('tabindex', '0');

    $timelineWrapper = $dom->createElement('div');
    $timelineWrapper->setAttribute('class', 'timeline-wrapper fade-up');

    $timeline = $dom->createElement('div');
    $timeline->setAttribute('class', 'timeline');

    // small icon (.icon)
    $icon = $dom->createElement('div');
    $icon->setAttribute('class', 'timeline-icon');

    $timeline->appendChild($icon);

    // timeline-content
    $timelineContent = $dom->createElement('div');
    $timelineContent->setAttribute('class', 'timeline-content');

    // date-content
    $dateContent = $dom->createElement('div');
    $dateContent->setAttribute('class', 'date-content');

    $teachingDate = $dom->createElement('div');
    $teachingDate->setAttribute('class', 'teaching-date');

    $span = $dom->createElement('span', 'Year');
    $teachingDate->appendChild($span);
    $span = $dom->createElement('span', 'XXX – XXX');
    $teachingDate->appendChild($span);

    $dateContent->appendChild($teachingDate);
    $timelineContent->appendChild($dateContent);

    $card = $dom->createElement('div');
    $card->setAttribute('class', 'card border-0');

    $cardBody = $dom->createElement('div');
    $cardBody->setAttribute('class', 'card-body p-xl-4');

    // big icon (.icon .h1)
    $smallIcon = $dom->createElement('div');
    $smallIcon->setAttribute('class', 'icon h1');

    $spanIcon = $dom->createElement('span');
    $spanIcon->setAttribute('class', 'uim-svg');

    $svg = $dom->createElement('svg');
    $svg->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $svg->setAttribute('viewBox', '0 0 24 24');
    $svg->setAttribute('width', '1em');
    $svg->setAttribute('height', '1em');
    $svg->setAttribute('fill', 'none');
    $svg->setAttribute('stroke', 'currentColor');
    $svg->setAttribute('stroke-width', '1.5');
    $svg->setAttribute('stroke-linecap', 'round');
    $svg->setAttribute('stroke-linejoin', 'round');

    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M2.5 12.25L12 8l9.5 4.25L12 16.5 2.5 12.25Z');
    $svg->appendChild($path);
    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M6.5 14.75v3.25c0 1.55 2.45 2.75 5.5 2.75s5.5-1.2 5.5-2.75v-3.25');
    $svg->appendChild($path);
    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M20.5 13v5');
    $svg->appendChild($path);
    $circle = $dom->createElement('circle');
    $circle->setAttribute('cx', '20.5');
    $circle->setAttribute('cy', '19.75');
    $circle->setAttribute('r', '1.25');
    $svg->appendChild($circle);

    $spanIcon->appendChild($svg);
    $smallIcon->appendChild($spanIcon);

    $cardBody->appendChild($smallIcon);

    // big icon (.big-icon)
    $bigIcon = $dom->createElement('div');
    $bigIcon->setAttribute('class', 'big-icon h1 text-custom');

    $spanBig = $dom->createElement('span');
    $spanBig->setAttribute('class', 'uim-svg');

    $svgBig = $dom->createElement('svg');
    $svgBig->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $svgBig->setAttribute('viewBox', '0 0 24 24');
    $svgBig->setAttribute('width', '1em');
    $svgBig->setAttribute('height', '1em');
    $svgBig->setAttribute('fill', 'currentColor');
    $svgBig->setAttribute('stroke', 'currentColor');
    $svgBig->setAttribute('stroke-width', '1.5');
    $svgBig->setAttribute('stroke-linecap', 'round');
    $svgBig->setAttribute('stroke-linejoin', 'round');


    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M2.5 12.25L12 8l9.5 4.25L12 16.5 2.5 12.25Z');
    // $path->setAttribute('fill', 'currentColor');
    $svgBig->appendChild($path);
    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M6.5 14.75v3.25c0 1.55 2.45 2.75 5.5 2.75s5.5-1.2 5.5-2.75v-3.25');
    // $path->setAttribute('fill', 'currentColor');
    $svgBig->appendChild($path);
    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M20.5 13v5');
    // $path->setAttribute('fill', 'currentColor');
    $svgBig->appendChild($path);
    $circle = $dom->createElement('circle');
    $circle->setAttribute('cx', '20.5');
    $circle->setAttribute('cy', '19.75');
    $circle->setAttribute('r', '1.25');
    // $circle->setAttribute('fill', 'currentColor');
    $svgBig->appendChild($circle);

    $spanBig->appendChild($svgBig);
    $bigIcon->appendChild($spanBig);

    // title, subtitle, description, link
    $titleElement = $dom->createElement('h2', $title);
    $titleElement->setAttribute('class', 'card-title mb-3');
    $cardBody->appendChild($titleElement);

    $subtitle = $dom->createElement('h5');
    $subtitle->setAttribute('class', 'card-subtitle text-secondary mb-1');
    $a = $dom->createElement('a');
    $a->setAttribute('href', 'XXX');
    $a->setAttribute('target', 'blank');
    $a->setAttribute('rel', 'noopener');
    $a->appendChild($dom->createTextNode('Department of XXX'));
    $spanBlock = $dom->createElement('span', 'University of XXX');
    $spanBlock->setAttribute('class', 'd-block');
    $a->appendChild($spanBlock);
    $subtitle->appendChild($a);
    $cardBody->appendChild($subtitle);

    $desc = $dom->createElement('p', 'Description of XXX.');
    $desc->setAttribute('class', 'card-text');
    $cardBody->appendChild($desc);

    $linkPara = $dom->createElement('p');
    $linkPara->setAttribute('class', 'card-text');
    $infoLink = $dom->createElement('a');
    $infoLink->setAttribute('class', 'ext-link');
    if ($page == 'teaching')
        $infoLink->setAttribute('href', $input . '/');
    else if ($page == 'home')
        $infoLink->setAttribute('href', 'teaching/' . $input . '/');
    $btn = $dom->createElement('span', 'More Info');
    $btn->setAttribute('class', 'btn btn-primary');
    $infoLink->appendChild($btn);
    $linkPara->appendChild($infoLink);
    $cardBody->appendChild($linkPara);

    $cardBody->appendChild($bigIcon);
    $card->appendChild($cardBody);
    $timelineContent->appendChild($card);
    $timeline->appendChild($timelineContent);
    $timelineWrapper->appendChild($timeline);
    $item->appendChild($timelineWrapper);

    return $item;
}

// function template_teaching($dom, $input) {
//     $id = formatID($input);
//     $title = formatTitle($input);

//     // <div class='timeline' id='...'>
//     $item = $dom->createElement('div');
//     $item->setAttribute('class', 'item');
//     $item->setAttribute('id', $id);
//     $item->setAttribute('tabindex', '0');

//     $timelineWrapper = $dom->createElement('div');
//     $timelineWrapper->setAttribute('class', 'timeline-wrapper');

//     $timeline = $dom->createElement('div');
//     $timeline->setAttribute('class', 'timeline');

//     // .icon
//     $icon = $dom->createElement('div');
//     $icon->setAttribute('class', 'icon');
//     $timeline->appendChild($icon);

//     // .date-content > .teaching-date > span
//     $dateContent = $dom->createElement('div');
//     $dateContent->setAttribute('class', 'date-content');

//     // $dateOuter = $dom->createElement('div');
//     // $dateOuter->setAttribute('class', 'date-outer');

//     // $date = $dom->createElement('div');
//     // $date->setAttribute('class', 'date');

//     $teachingDate = $dom->createElement('div');
//     $teachingDate->setAttribute('class', 'teaching-date');

//     $span = $dom->createElement('span', 'Year');
//     $teachingDate->appendChild($span);

//     $span = $dom->createElement('span', 'XXX – XXX');
//     $teachingDate->appendChild($span);

//     // $date->appendChild($teachingDate);
//     // $dateOuter->appendChild($date);

//     // $dateContent->appendChild($dateOuter);
//     $dateContent->appendChild($teachingDate);
//     $timeline->appendChild($dateContent);

//     // .timeline-content
//     $timelineContent = $dom->createElement('div');
//     $timelineContent->setAttribute('class', 'timeline-content');

//     // .card.border-0
//     $card = $dom->createElement('div');
//     $card->setAttribute('class', 'card border-0');

//     // .card-body.p-xl-4
//     $cardBody = $dom->createElement('div');
//     $cardBody->setAttribute('class', 'card-body p-xl-4');

//     // h2.card-title
//     $titleElement = $dom->createElement('h2', $title);
//     $titleElement->setAttribute('class', 'card-title mb-3');
//     $cardBody->appendChild($titleElement);

//     // h5.card-subtitle
//     $subtitle = $dom->createElement('h5');
//     $subtitle->setAttribute('class', 'card-subtitle text-secondary mb-1');

//     $a = $dom->createElement('a');
//     $a->setAttribute('href', 'XXX');
//     $a->setAttribute('target', 'blank');
//     $a->setAttribute('rel', 'noopener');
//     $a->appendChild($dom->createTextNode('Department of XXX'));

//     $spanBlock = $dom->createElement('span', 'University of XXX');
//     $spanBlock->setAttribute('class', 'd-block');
//     $a->appendChild($spanBlock);
//     $subtitle->appendChild($a);
//     $cardBody->appendChild($subtitle);

//     // p.card-text (descrizione)
//     $desc = $dom->createElement('p');
//     $desc->setAttribute('class', 'card-text');
//     $desc->appendChild($dom->createTextNode('Description of XXX.'));
//     $cardBody->appendChild($desc);

//     // p.card-text con link
//     $linkPara = $dom->createElement('p');
//     $linkPara->setAttribute('class', 'card-text');

//     $infoLink = $dom->createElement('a');
//     $infoLink->setAttribute('class', 'ext-link');
//     $infoLink->setAttribute('href', 'teaching/' . $input);

//     $btn = $dom->createElement('span', 'More Info');
//     $btn->setAttribute('class', 'btn btn-primary');
//     $infoLink->appendChild($btn);
//     $linkPara->appendChild($infoLink);
//     $cardBody->appendChild($linkPara);

//     $card->appendChild($cardBody);
//     $timelineContent->appendChild($card);
//     $timeline->appendChild($timelineContent);

//     $timelineWrapper->appendChild($timeline);
//     $item->appendChild($timelineWrapper);

//     return $item;
// }


function template_publications($dom, $input, $page) {
    $id = formatID($input);
    $title = formatTitle($input);

    $infoItems = [
        'Journal XXX,',
        'vol. XXX,',
        'no. XXX,',
        'pp. XXX–XXX,',
        'year XXX'
    ];

    $bibtex = "@article{enggeo,
        title = {{$title}},
        volume = {XX},
        number = {XXX}
        journal = {XXX},
        publisher = {XXX},
        author = {XXX},
        year = {XXX},
        month = XXX,
        pages = {XXX–XXX}
    }";
    $doiUrl = 'https://doi.org/XXX';

    // <div class='article' id='...'>
    $item = $dom->createElement('div');
    if ($page == 'publications')
        $item->setAttribute('class', 'isotope-item pubtype-XXX pubyear-XXX');
    else if ($page == 'home')
        $item->setAttribute('class', 'item');
    $item->setAttribute('id', $id);
    $item->setAttribute('tabindex', '0');

    $articleWrapper = $dom->createElement('div');
    $articleWrapper->setAttribute('class', 'card-wrapper fade-up');

    $articleDiv = $dom->createElement('div');
    $articleDiv->setAttribute('class', 'article');

    // .article > h4.article-title
    $titleElement = $dom->createElement('h4', $title);
    $titleElement->setAttribute('class', 'article-title');
    $articleDiv->appendChild($titleElement);

    // .article > .article-authors > span
    $authorsDiv = $dom->createElement('div');
    $authorsDiv->setAttribute('class', 'article-authors');
    $authorsSpan = $dom->createElement('span', 'Authors XXX');
    $authorsDiv->appendChild($authorsSpan);
    $articleDiv->appendChild($authorsDiv);

    // .article > .article-info > span (repeated)
    $infoDiv = $dom->createElement('div');
    $infoDiv->setAttribute('class', 'article-info');
    foreach ($infoItems as $infoText) {
        $infoSpan = $dom->createElement('span', $infoText);
        $infoDiv->appendChild($infoSpan);
    }
    $articleDiv->appendChild($infoDiv);

    // .article > .article-reference (BibTeX text)
    $refDiv = $dom->createElement('div');
    $refDiv->setAttribute('class', 'article-reference');
    $refText = $dom->createTextNode($bibtex);
    $refDiv->appendChild($refText);
    $articleDiv->appendChild($refDiv);

    // .article > .article-data > button.btn-modal + a.btn-outline-primary
    $dataDiv = $dom->createElement('div');
    $dataDiv->setAttribute('class', 'article-data');

    // .article-data > button.btn-modal[data-bs-filename]
    $citeBtn = $dom->createElement('button', 'Cite');
    $citeBtn->setAttribute('type', 'button');
    $citeBtn->setAttribute('class', 'btn btn-outline-primary btn-modal');
    $citeBtn->setAttribute('data-bs-toggle', 'modal');
    $citeBtn->setAttribute('data-bs-target', '#modal-cite');
    $citeBtn->setAttribute('data-bs-filename', $id);
    $dataDiv->appendChild($citeBtn);

    // .article-data > a.btn-outline-primary[href]
    $pdfLink = $dom->createElement('a', 'PDF');
    $pdfLink->setAttribute('class', 'btn btn-outline-primary');
    $pdfLink->setAttribute('href', $doiUrl);
    $pdfLink->setAttribute('target', 'blank');
    $pdfLink->setAttribute('rel', 'noopener');
    $dataDiv->appendChild($pdfLink);

    $articleDiv->appendChild($dataDiv);

    $articleWrapper->appendChild($articleDiv);
    $item->appendChild($articleWrapper);

    return $item;
}


function template_talks($dom, $input, $page, $type) {
    $id = formatID($input);
    $title = str_replace('_', ' ', $input);

    // === Create .card.award-wrapper
    $item = $dom->createElement('div');
    if ($type == 'talks')
        $item->setAttribute('class', 'isotope-item cardtype-XXX cardyear-XXX');
    else if ($type == 'home')
        $item->setAttribute('class', 'item');
    $item->setAttribute('id', $id);
    $item->setAttribute('tabindex', '0');

    $cardWrapper = $dom->createElement('div');
    $cardWrapper->setAttribute('class', 'card-wrapper fade-up');

    $card = $dom->createElement('div');
    $card->setAttribute('class', 'card');

    $row = $dom->createElement('div');
    $row->setAttribute('class', 'card-body justify-content-center');

    // === ICON SMALL
    $iconDiv = $dom->createElement('div');
    $iconDiv->setAttribute('class', 'icon h1');

    $spanIcon = $dom->createElement('span');
    $spanIcon->setAttribute('class', 'uim-svg');

    $svg = $dom->createElement('svg');
    $svg->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $svg->setAttribute('viewBox', '0 0 24 24');
    $svg->setAttribute('width', '1em');
    $svg->setAttribute('height', '1em');
    $svg->setAttribute('fill', 'none');
    $svg->setAttribute('stroke', 'currentColor');
    $svg->setAttribute('stroke-width', '1.5');
    $svg->setAttribute('stroke-linecap', 'round');
    $svg->setAttribute('stroke-linejoin', 'round');

    if ($page == 'talks') {
        $path = $dom->createElement('path'); 
        $path->setAttribute('d', 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z'); 
        $svg->appendChild($path);
        $path = $dom->createElement('path'); 
        $path->setAttribute('d', 'M19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0z'); 
        $svg->appendChild($path);
        $path = $dom->createElement('path'); 
        $path->setAttribute('d', 'M13 21.93V19.95A7.002 7.002 0 0 0 18.92 17h-2.02A5.003 5.003 0 0 1 13 19.9v-1.9h-2v1.9a5.003 5.003 0 0 1-3.9-2.9H5.08A7.002 7.002 0 0 0 11 19.95v1.98h2z'); 
        $svg->appendChild($path);
    } else if ($page == 'awards') {
        $path = $dom->createElement('path'); 
        $path->setAttribute('d', 'M12 2l2.89 6.26L22 9.27l-5 4.87L18.18 22 12 18.26 5.82 22 7 14.14 2 9.27l7.11-1.01L12 2z'); 
        $svg->appendChild($path);
    } else if ($page == 'patents') {
        $path = $dom->createElement('path');
        $path->setAttribute('d', 'M12 4 a4.5 4.5 0 0 1 4.5 4.5 c0 1.5-.8 2.6-1.6 3.3 -.5.4-.7.8-.7 1.2v1H9.8v-1 c0-.4-.2-.8-.7-1.2C8.3 11.1 7.5 10 7.5 8.5 A4.5 4.5 0 0 1 12 4z');
        $path->setAttribute('transform','translate(0,2)');
        $svg->appendChild($path);
        $path = $dom->createElement('path');
        $path->setAttribute('d', 'M10 16h4v1h-4zm0 2h4v1h-4');
        $path->setAttribute('transform','translate(0,2)');
        $svg->appendChild($path);
        $path = $dom->createElement('path');
        $path->setAttribute('d', 'M12 2 L12 1 M5.5 9 L4.5 9 M18.5 9 L19.5 9 M7 4 L6.2 3.2 M17 4 L17.8 3.2 M7.8 14 L7 14.8');
        $path->setAttribute('transform','translate(0,2)');
        $svg->appendChild($path);
        $circle = $dom->createElement('circle');
        $circle->setAttribute('cx','8'); $circle->setAttribute('cy','8'); $circle->setAttribute('r','6');
        $circle->setAttribute('transform','translate(15.5,12.5) scale(0.5)');
        $svg->appendChild($circle);
        $path = $dom->createElement('path'); 
        $path->setAttribute('d', 'm6 14-1.5 4 3-1.5 3 1.5L9 14');
        $path->setAttribute('transform','translate(15.75,12.5) scale(0.5)'); 
        $svg->appendChild($path);
        $path = $dom->createElement('path');
        $path->setAttribute('d', 'M5 8l2 2 3-3');
        $path->setAttribute('transform','translate(15.85,12.5) scale(0.5)'); 
        $svg->appendChild($path);
    }

    $spanIcon->appendChild($svg);
    $iconDiv->appendChild($spanIcon);
    $row->appendChild($iconDiv);

    // === CONTENT
    $contentDiv = $dom->createElement('div');
    $contentDiv->setAttribute('class', 'content');

    $titleEl = $dom->createElement('h4', $title);
    $titleEl->setAttribute('class', 'card-title');
    $contentDiv->appendChild($titleEl);

    $subtitle = $dom->createElement('div');
    $subtitle->setAttribute('class', 'card-subtitle');
    $link = $dom->createElement('a', 'Event XXX');
    $link->setAttribute('href', 'https://www.XXX');
    $link->setAttribute('target', 'blank');
    $link->setAttribute('rel', 'noopener');
    $subtitle->appendChild($link);
    $contentDiv->appendChild($subtitle);

    $infoText = $dom->createElement('div');
    $infoText->setAttribute('class', 'card-text');
    $infoText->nodeValue = ' Date XXX ';
    // $calendarIcon = $dom->createElement('i');
    // $calendarIcon->setAttribute('class', 'fa-solid fa-calendar-alt');
    // $calendarIcon->setAttribute('aria-hidden', 'true');
    $calendarSvg = $dom->createElement('svg');
    $calendarSvg->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $calendarSvg->setAttribute('viewBox', '0 0 448 512');
    $calendarSvg->setAttribute('width', '15');
    $calendarSvg->setAttribute('height', '15'); 
    $calendarSvg->setAttribute('fill', 'currentcolor');
    $calendarSvg->setAttribute('stroke', 'currentcolor');
    $calendarSvg->setAttribute('class', 'svg-calendar');

    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M0 464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V192H0v272zm320-196c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM192 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12h-40c-6.6 0-12-5.4-12-12v-40zM64 268c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zm0 128c0-6.6 5.4-12 12-12h40c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H76c-6.6 0-12-5.4-12-12v-40zM400 64h-48V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H160V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48H48C21.5 64 0 85.5 0 112v48h448v-48c0-26.5-21.5-48-48-48z');

    $calendarSvg->appendChild($path);

    // $infoText->insertBefore($calendarIcon, $infoText->firstChild);
    $infoText->insertBefore($calendarSvg, $infoText->firstChild);

    $dot = $dom->createElement('span');
    $dot->setAttribute('class', 'dot-divider');
    $infoText->appendChild($dot);

    // $mapIcon = $dom->createElement('i');
    // $mapIcon->setAttribute('class', 'fa-solid fa-map-marker-alt');
    // $mapIcon->setAttribute('aria-hidden', 'true');
    $mapSvg = $dom->createElement('svg');
    $mapSvg->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    $mapSvg->setAttribute('viewBox', '0 0 384 512');
    $mapSvg->setAttribute('width', '15');
    $mapSvg->setAttribute('height', '15'); 
    $mapSvg->setAttribute('fill', 'currentcolor');
    $mapSvg->setAttribute('stroke', 'currentcolor');
    $mapSvg->setAttribute('class', 'svg-map');

    $path = $dom->createElement('path');
    $path->setAttribute('d', 'M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z');

    $mapSvg->appendChild($path);
    
    # $infoText->appendChild($mapIcon);
    $infoText->appendChild($mapSvg);
    $infoText->appendChild($dom->createTextNode(' Location XXX'));
    $contentDiv->appendChild($infoText);

    $desc = $dom->createElement('div', 'Description XXX');
    $desc->setAttribute('class', 'card-text');
    $contentDiv->appendChild($desc);

    $row->appendChild($contentDiv);

    // === BIG ICON (filled)
    $bigIcon = $dom->createElement('div');
    $bigIcon->setAttribute('class', 'big-icon h1 text-custom');

    $bigSpan = $dom->createElement('span');
    $bigSpan->setAttribute('class', 'uim-svg');

    $bigSvg = $svg->cloneNode(true);

    if ($page == 'talks' || $page == 'awards') {
        $bigSvg->setAttribute('fill', 'currentColor');
        $bigSvg->removeAttribute('stroke');
    } else if ($page == 'patents') {
        foreach ($bigSvg->childNodes as $child) {
            if ($child->nodeName === 'path') {
                $d = $child->getAttribute('d');
                if (strpos($d, 'M12 4') !== false || strpos($d, 'm6 14') !== false) {
                    $child->setAttribute('fill', 'currentColor');
                    $child->removeAttribute('stroke');
                } else {
                    $child->setAttribute('fill', 'none');
                    $child->setAttribute('stroke', 'currentColor');
                }
            } elseif ($child->nodeName === 'circle') {
                $child->setAttribute('fill', 'none');
                $child->setAttribute('stroke', 'currentColor');
            }
        }
    }

    $bigSpan->appendChild($bigSvg);
    $bigIcon->appendChild($bigSpan);
    $row->appendChild($bigIcon);

    // === Assemble
    $card->appendChild($row);
    $cardWrapper->appendChild($card);
    $item->appendChild($cardWrapper);

    return $item;
}

// function template_talks($dom, $input, $page, $type) {
//     $id = formatID($input);
//     # $title = formatTitle($input);
//     $title = str_replace('_', ' ', $input);

//     // === Create .card.award-wrapper
//     $item = $dom->createElement('div');
//     if ($type == 'talks')
//         $item->setAttribute('class', 'isotope-item cardtype-XXX year-XXX');
//     else
//         $item->setAttribute('class', 'item');
//     $item->setAttribute('id', $id);
//     $item->setAttribute('tabindex', '0');

//     $cardWrapper = $dom->createElement('div');
//     $cardWrapper->setAttribute('class', 'card-wrapper fade-up');

//     $card = $dom->createElement('div');
//     $card->setAttribute('class', 'card');

//     // === .row.card-body.justify-content-center
//     $row = $dom->createElement('div');
//     $row->setAttribute('class', 'card-body justify-content-center');

//     // === .icon.h1 > .uim-svg > svg (award icon)
//     // // .card.award-wrapper > .row.card-body > .col > .icon.h1 > .uim-svg > svg
//     $iconDiv = $dom->createElement('div');
//     $iconDiv->setAttribute('class', 'icon h1');

//     $spanIcon = $dom->createElement('span');
//     $spanIcon->setAttribute('class', 'uim-svg');

//     $svg = $dom->createElement('svg');
//     $svg->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
//     $svg->setAttribute('viewBox', '0 0 24 24');
//     $svg->setAttribute('width', '1em');
//     $svg->setAttribute('fill', 'currentColor');

//     if ($page == 'talks') {
//         $path = $dom->createElement('path');
//         $path->setAttribute('d', 'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z');
//         $svg->appendChild($path);
//         $path = $dom->createElement('path');
//         $path->setAttribute('d', 'M19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0z');
//         $svg->appendChild($path);
//         $path = $dom->createElement('path');
//         $path->setAttribute('d', 'M13 21.93V19.95A7.002 7.002 0 0 0 18.92 17h-2.02A5.003 5.003 0 0 1 13 19.9v-1.9h-2v1.9a5.003 5.003 0 0 1-3.9-2.9H5.08A7.002 7.002 0 0 0 11 19.95v1.98h2z');
//         $svg->appendChild($path);
//     } else if ($page == 'awards') {
//         $path = $dom->createElement('path');
//         $path->setAttribute('d', 'M12 2l2.89 6.26L22 9.27l-5 4.87L18.18 22 12 18.26 5.82 22 7 14.14 2 9.27l7.11-1.01L12 2z');
//         $svg->appendChild($path);
//     }

//     $spanIcon->appendChild($svg);
//     $iconDiv->appendChild($spanIcon);
//     $row->appendChild($iconDiv);

//     // === .content block
//     // // .card.award-wrapper > .row.card-body > .col > .content > .card-title
//     $contentDiv = $dom->createElement('div');
//     $contentDiv->setAttribute('class', 'content');

//     $titleEl = $dom->createElement('h4', $title);
//     $titleEl->setAttribute('class', 'card-title');
//     $contentDiv->appendChild($titleEl);

//     // // .content > .card-subtitle > a
//     $subtitle = $dom->createElement('div');
//     $subtitle->setAttribute('class', 'card-subtitle');

//     $link = $dom->createElement('a', 'Event XXX');
//     $link->setAttribute('href', 'https://www.XXX');
//     $link->setAttribute('target', 'blank');
//     $link->setAttribute('rel', 'noopener');

//     $subtitle->appendChild($link);
//     $contentDiv->appendChild($subtitle);

//     // // .content > .card-text (date + location)
//     $infoText = $dom->createElement('div');
//     $infoText->setAttribute('class', 'card-text');
//     $infoText->nodeValue = ' Date XXX ';
    
//     $calendarIcon = $dom->createElement('i');
//     $calendarIcon->setAttribute('class', 'fa-solid fa-calendar-alt');
//     $calendarIcon->setAttribute('aria-hidden', 'true');
//     $infoText->insertBefore($calendarIcon, $infoText->firstChild);

//     $dot = $dom->createElement('span');
//     $dot->setAttribute('class', 'dot-divider');
//     $infoText->appendChild($dot);

//     $mapIcon = $dom->createElement('i');
//     $mapIcon->setAttribute('class', 'fa-solid fa-map-marker-alt');
//     $mapIcon->setAttribute('aria-hidden', 'true');
//     $infoText->appendChild($mapIcon);
//     $infoText->appendChild($dom->createTextNode(' Location XXX'));
//     $contentDiv->appendChild($infoText);

//     // // .content > .card-text (description)
//     $desc = $dom->createElement('div', 'Description XXX');
//     $desc->setAttribute('class', 'card-text');
//     $contentDiv->appendChild($desc);

//     $row->appendChild($contentDiv);

//     // === .big-icon.h1.text-custom (bottom icon)
//     // // .card.award-wrapper > .big-icon.h1.text-custom > .uim-svg > svg
//     $bigIcon = $dom->createElement('div');
//     $bigIcon->setAttribute('class', 'big-icon h1 text-custom');

//     $bigSpan = $dom->createElement('span');
//     $bigSpan->setAttribute('class', 'uim-svg');

//     $bigSvg = $svg->cloneNode(true); // reuse the same SVG as above
//     $bigSpan->appendChild($bigSvg);
//     $bigIcon->appendChild($bigSpan);

//     // === Assemble everything
//     $row->appendChild($bigIcon);
//     $card->appendChild($row);

//     $cardWrapper->appendChild($card);
//     $item->appendChild($cardWrapper);

//     return $item;
// }

?>