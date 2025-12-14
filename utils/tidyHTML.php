<?php

class tidyHTML {
    
    private $usedJSNames = [];
    private $indentSize = 4;
    private $sourceHtml = "";
    private $offset = -4;

    public function SetIndentSize($size) {
        $this->indentSize = $size;
    }

    public function __construct($html) {
        $this->sourceHtml = $html;
    }

    public function OriginalSource() {
        return $this->sourceHtml;
    }

    public function UpdateSource($html) {
        $this->sourceHtml = $html;          
    }

    public function SetOffset($offset) {
        $this->offset = $offset;
    }

    function BeautifiedHTML() {
        $this->usedJSNames = [];
        $buffer = $this->sourceHtml;
        $spacesPerIndent = $this->indentSize;
        $JSPlaceHolders = [];

        $preserveBlocks = [];
        $buffer = preg_replace_callback(
            '/<div class=[\'"]article-reference[\'"]>(.*?)<\/div>/s',
            function ($matches) use (&$preserveBlocks) {
                if (strpos($matches[1], '@') === 0) {
                    $content = trim($matches[1]);
                    preg_match('/^([ \t]*)<div class=[\'"]article-reference[\'"]>/m', $this->sourceHtml, $matches);
                    $indentation = $matches[1];

                    $lines = preg_split('/\r\n|\r|\n/', $content);

                    foreach ($lines as $i => $line) {
                        if ($i === 0 || $i === count($lines) - 1) {
                            $lines[$i] = $indentation . "\t" . ltrim($line);
                        } else {
                            $lines[$i] = $indentation . "\t\t" . ltrim($line);
                        }
                    }

                    $content = implode("\n", $lines);

                    $preserveBlock = "<div class='article-reference'>\n" . $content . "\n" . $indentation . "</div>";
                    $preserveBlock = str_replace("\t", "    ", $preserveBlock);

                    $uniqueKey = "PRESERVE_BLOCK_" . count($preserveBlocks);
                    $preserveBlocks[$uniqueKey] = $preserveBlock;
                    return $uniqueKey;
                }

                $uniqueKey = "PRESERVE_BLOCK_" . count($preserveBlocks);
                $preserveBlocks[$uniqueKey] = $matches[0];
                return $uniqueKey;
            },
            $buffer
        );

        // $buffer = preg_replace_callback(
        //     '/^([ \t]*)<div class=[\'"]article-reference[\'"]>(.*?)<\/div>/s',
        //     function ($matches) use (&$preserveBlocks) {
        //         if (strpos($matches[2], '@') === 0) {
        //             $baseIndent = $matches[1];
        //             $content = trim($matches[2]);

        //             echo $baseIndent;
        //             echo $content;

        //             $lines = preg_split('/\r\n|\r|\n/', $content);

        //             // Aggiungi 1 livello extra di indentazione rispetto al div
        //             $contentIndent = $baseIndent . "\t";

        //             foreach ($lines as $i => $line) {
        //                 if ($i === 1 || $i === count($lines) - 1) {
        //                     $lines[$i] = $baseIndent . "\t" . ltrim($line);
        //                 } else {
        //                     $lines[$i] = $baseIndent . "\t\t" . ltrim($line);
        //                 }
        //             }

        //             $content = implode("\n", $lines);

        //             $preserveBlock = $baseIndent . "<div class='article-reference'>\n" .
        //                              $content . "\n" .
        //                              $baseIndent . "</div>";

        //             // Converti i tab in 4 spazi
        //             $preserveBlock = str_replace("\t", "    ", $preserveBlock);

        //             $uniqueKey = "PRESERVE_BLOCK_" . count($preserveBlocks);
        //             $preserveBlocks[$uniqueKey] = $preserveBlock;
        //             return $uniqueKey;
        //         }

        //         // fallback: conserva così com'è
        //         $uniqueKey = "PRESERVE_BLOCK_" . count($preserveBlocks);
        //         $preserveBlocks[$uniqueKey] = $matches[0];
        //         return $uniqueKey;
        //     },
        //     $buffer
        // );

        $out = str_replace("\r", "\n", $buffer);
        $out = str_replace("\n\n", "\n", $out);
        $out = str_replace("<script", "\n<script", $out);
        $out = str_replace("</script>", "\n</script>\n", $out);
        $lines = explode("\n", $out);
        $javascript = "";
        $outLines = [];
        for ($i = 0; $i < count($lines); $i++) {
            $line = $lines[$i];
            $line = trim($line);
            if ($line == "</script>")
                continue;
            if (strlen($line) >= strlen("<script")) {
                if (strtolower(substr($line, 0, 7)) == "<script") {
                    if (strpos(strtolower($line), "</script>")) {
                        $outLines[] = $line;
                    } else {
                        $counter = $i + 1;
                        $jsLine = $lines[$counter];
                        $javascript = "";
                        $lineCount = 0;
                        while (strtolower(trim($jsLine)) !== "</script>") {
                            $lineCount++;
                            $javascript .= $jsLine . "\n";
                            $counter++;
                            if ($counter > count($lines) - 1)
                                break;
                            $jsLine = $lines[$counter];
                        }
                        $i += $lineCount;
                        if (trim($javascript) == "") {
                            $i++;
                            $line2 = $lines[$i];
                            $thisLine = $line . $line2;
                            if (strpos($thisLine, "src=")) {
                                $outLines[] = $thisLine;
                            } else {
                                $chars = str_split($thisLine);
                                
                                $stO = strpos(strtolower($thisLine), "<script");
                                $enO = strpos(strtolower($thisLine), ">", $stO) + 1;
                                $tagO = substr($thisLine,$stO,$enO);
                                
                                $stC = strpos(strtolower($thisLine), "</script");
                                $enC = strpos(strtolower($thisLine), ">", $stC) + 1;
                                $tagC = substr($thisLine, $stC, $enC);
                                $javascript = substr($thisLine, $enO, $stC - $enO);
                                $outLines[] = "<script type='application/javascript'>" . $javascript . "</script>";             
                            }
                        } else {
                            $unique = $this->GetUniqueJSPlaceHolder($out);
                            $JSPlaceHolders[$unique] = ['javascript' => $javascript];
                            $outLines[] = "<$unique type='application/javascript'></$unique>";
                        }
                    }
                } else {
                    $outLines[] = $line;
                }
            } else {
                $outLines[] = $line;
            }
        }
        $modHTML = "";
        foreach ($outLines as $line) {
            $modHTML .= $line . "\n";
        }
        $modHTML = str_replace("\n", "", $modHTML);
        $modHTML = str_replace(">", ">\n", $modHTML);
        $modHTML = str_replace("<", "\n<", $modHTML);
        $modHTML = str_replace("\n\n", "\n", $modHTML);
        $lines = explode("\n", $modHTML);
        $outLines = [];
        $indentLevel = -$spacesPerIndent + $this->offset;
        $openTags = [];
        foreach($lines as $line) {
            $line = trim($line);
            if ($line !== "")
                $outLines[] = $line;
        }
        $modHTML = "";
        for ($j = 0; $j < count($outLines); $j++) {
            $line = $outLines[$j];
            $isCloseTag = false;
            $firstChar = substr($line, 0, 1);
            $isMetaTag = substr(strtolower($line), 1, 4) == "meta" ? true: false;
            $isDocType = substr(strtolower($line), 2, 7) == "doctype" ? true: false;
            $isSelfClosing = substr($line, strlen($line) - 2, 1) == "/" ? true : false;
            $beginComment = substr($line, 0, 4) == "<!--" ? true : false;
            $applyIndent = ($firstChar == "<") ? true : false;
            $applyIndent = $isMetaTag ? false : $applyIndent;
            $applyIndent = $isDocType ? false : $applyIndent;
            $applyIndent = $isSelfClosing ? false : $applyIndent;
            $applyIndent = $beginComment ? false : $applyIndent;
            $contentIndent = $applyIndent ? false : true;
            $tag = "";
            if ($applyIndent) {
                //This is a tag only
                $tagInner = substr($line, 1, -1);
                $tag = "";
                for ($i = 0; $i < strlen($tagInner); $i++) {
                    $char = substr($tagInner, $i, 1);
                    if ($char == " ")
                        break;
                    if ($char == ">")
                        break; 
                    $tag .= $char;
                }
                $isCloseTag = substr($tag, 0, 1) == "/" ? true : false;

                $selfClosingTags = ["link", "img", "input", "br", "hr", "meta", "area", "base", "col", "embed", "source", "track", "wbr"];

                if (in_array(strtolower($tag), $selfClosingTags)) {
                    # $line = substr($line, 0, -1) . "/>";
                    $isSelfClosing = true;
                }

                if ($isSelfClosing == false) {
                    if ($isCloseTag) {
                        $indentLevel -= $spacesPerIndent;   
                    } else {
                        $indentLevel += $spacesPerIndent;
                        $findTag = "</$tag>";
                        $line2 = $outLines[$j + 1];
                        if (strtolower($line2) == strtolower($findTag)) {
                            $line = $line . $line2;
                            $j += 1;
                            $indentLevel -= $spacesPerIndent;
                            $isCloseTag = true;
                        }
                    }
                }
            }

            $spaces = $indentLevel;
            $spaces += $contentIndent ? $spacesPerIndent : 0;
            $spaces += $isCloseTag ? $spacesPerIndent : 0;
            $spaces += $isSelfClosing ? $spacesPerIndent : 0;
            $prependSpace = str_repeat(" ", $spaces);
            $line = $prependSpace . $line;
            if ($tag !== "") {
                $keys = array_keys($JSPlaceHolders);
                if (in_array($tag, $keys)) {
                    $JSPlaceHolders[$tag]['indent'] = $indentLevel;
                }
            }           
            $modHTML .= $line . "\n";
        }
        $keys = array_keys($JSPlaceHolders);
        foreach($keys as $key) {
            $javascript = $JSPlaceHolders[$key]['javascript'];
            $indentOffset = $JSPlaceHolders[$key]['indent'] + 1;
            $javascript = $this->JSTidy($javascript, $indentOffset + ($spacesPerIndent * 2), $spacesPerIndent);
            $otStart = strpos($modHTML, "<$key");
            $otEnd   = strpos($modHTML, ">", $otStart) + 1;
            $ot = substr($modHTML,$otStart, ($otEnd - $otStart));
            $otOut = str_replace($key, "script", $ot);
            $ctStart = strpos($modHTML, "</$key", $otEnd);
            $ctEnd = strpos($modHTML, ">", $ctStart) + 1;
            $ct = substr($modHTML, $ctStart, ($ctEnd - $ctStart));
            $ctOut = str_repeat(" ", $indentOffset + $spacesPerIndent - 1) . str_replace($key, "script", $ct);
            $otOut .= "\n" . $javascript . "\n";
            $modHTML = str_replace($ot, $otOut, $modHTML);
            $modHTML = str_replace($ct, $ctOut, $modHTML);
        }

        foreach ($preserveBlocks as $key => $originalContent) {
            $modHTML = str_replace($key, $originalContent, $modHTML);
        }
        return preg_replace('/\s+$/', '', $modHTML);
    }

    function JSTidy($javascript, $indentOffset, $spacesPerIndent) {
        $javascript = str_replace("{", "\n{", $javascript);
        $javascript = str_replace("}", "\n}", $javascript);
        $minJs = preg_replace(array("/\s+\n/", "/\n\s+/", "/ +/"), array("\n", "\n ", " "), $javascript);
        $jsLines = explode("\n", $minJs);
        $jsOut = "";
        $indent = $indentOffset;
        $count = count($jsLines);
        for ($j = 0; $j < $count; $j++) {
            $line = trim($jsLines[$j]);
            if ($line == "")
                continue;
            $c = substr($line, 0, 1);
            if ($c == "}")
                $indent = $indent - $spacesPerIndent;
            $i = 0;
            $outLine = "";
            while (++$i < $indent) {
                $outLine .= " ";
            }
            $outLine .= $line;
            $jsOut .= $outLine;
            if ($j < $count - 2) {
                $jsOut .= "\n";
            }
            if ($c == "{")
                $indent = $indent + $spacesPerIndent;             
        }
        return $jsOut;
    }

    function GetUniqueJSPlaceHolder($targetHTML) {
        $this->usedJSNames;
        $str = rand(); 
        $unique = "JS" . strtoupper(hash("sha256", $str));
        while (strpos($targetHTML,$unique) || in_array($unique, $this->usedJSNames)) {
            $str = rand(); 
            $unique = "JS" . strtoupper(hash("sha256", $str));
        }
        $this->usedJSNames[] = $unique;
        return $unique;
    }
}

?>