"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PythonRunner } from "@/components/python-runner"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"

export default function CompilerPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [copied, setCopied] = useState(false)

  const handleOutput = (outputText: string) => {
    setOutput(outputText)
  }

  const copyIframeCode = () => {
    const iframeCode = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Python Compiler</title>
    <style>
        body { margin: 0; padding: 0; font-family: sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .editor-container { margin-bottom: 20px; }
        textarea { width: 100%; height: 300px; font-family: monospace; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
        .input-container { margin-bottom: 20px; }
        .output-container { margin-bottom: 20px; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; min-height: 100px; max-height: 300px; }
        button { background-color: #0070f3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #0051a2; }
        button:disabled { background-color: #ccc; cursor: not-allowed; }
    </style>
    <script src="https://skulpt.org/js/skulpt.min.js" type="text/javascript"></script>
    <script src="https://skulpt.org/js/skulpt-stdlib.js" type="text/javascript"></script>
</head>
<body>
    <div class="container">
        <h1>Python Compiler</h1>
        
        <div class="editor-container">
            <h2>Code</h2>
            <textarea id="code">print("Hello, World!")</textarea>
        </div>
        
        <div class="input-container">
            <h2>Input</h2>
            <textarea id="input" style="height: 100px;"></textarea>
        </div>
        
        <div>
            <button id="runButton">Run</button>
        </div>
        
        <div class="output-container">
            <h2>Output</h2>
            <pre id="output">Press "Run" to execute the code</pre>
        </div>
    </div>
    
    <script type="text/javascript">
        // Function to handle output
        function outf(text) {
            var output = document.getElementById("output");
            output.textContent += text;
        }
        
        // Function to handle input
        function builtinRead(x) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
                throw "File not found: '" + x + "'";
            return Sk.builtinFiles["files"][x];
        }
        
        // Function to run Python code
        function runPython() {
            var code = document.getElementById("code").value;
            var input = document.getElementById("input").value;
            var output = document.getElementById("output");
            output.textContent = "";
            
            // Set up input handling
            var inputLines = input ? input.split('\\n') : [];
            var inputIndex = 0;
            
            Sk.configure({
                output: outf,
                read: builtinRead,
                inputfun: function(prompt) {
                    return new Promise(function(resolve) {
                        if (inputIndex < inputLines.length) {
                            var line = inputLines[inputIndex++].trim();
                            if (prompt) {
                                outf(prompt);
                            }
                            resolve(line);
                        } else {
                            if (prompt) {
                                outf(prompt);
                            }
                            resolve("");
                        }
                    });
                },
                __future__: Sk.python3
            });
            
            var runButton = document.getElementById("runButton");
            runButton.disabled = true;
            runButton.textContent = "Running...";
            
            var promise = Sk.misceval.asyncToPromise(function() {
                return Sk.importMainWithBody("<stdin>", false, code, true);
            });
            
            promise.then(
                function(mod) {
                    // Success
                    runButton.disabled = false;
                    runButton.textContent = "Run";
                },
                function(err) {
                    // Error
                    outf("Error: " + err.toString() + "\\n");
                    runButton.disabled = false;
                    runButton.textContent = "Run";
                }
            );
        }
        
        // Add event listener to run button
        document.getElementById("runButton").addEventListener("click", runPython);
        
        // Add keyboard shortcut (Ctrl+Enter) to run code
        document.getElementById("code").addEventListener("keydown", function(e) {
            if (e.ctrlKey && e.key === "Enter") {
                runPython();
            }
        });
    </script>
</body>
</html>
`
    navigator.clipboard.writeText(iframeCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Python Compiler</h1>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Standalone Compiler</h2>
        <Button onClick={copyIframeCode} className="flex items-center gap-2">
          <Copy className="h-4 w-4" />
          {copied ? "Copied!" : "Copy HTML"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Редактор кода</CardTitle>
            </CardHeader>
            <CardContent>
              <PythonRunner onOutput={handleOutput} input={input} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Входные данные</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Введите входные данные для программы..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Вывод</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md whitespace-pre-wrap min-h-[200px] text-sm overflow-auto max-h-[400px]">
                {output || "Здесь будет вывод программы..."}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>


    
    </main>
  )
}

