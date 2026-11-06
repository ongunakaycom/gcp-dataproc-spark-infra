/* ==========================================================================
   dataproc.lab — interactions
   - scroll reveal
   - interactive architecture diagram
   - typewriter terminal simulation (100% client-side)
   ========================================================================== */

(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ------------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------------ */
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !reducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------------
     Interactive architecture diagram
     ------------------------------------------------------------------------ */
  const architecture = {
    terraform: {
      kicker: "Infrastructure as code",
      title: "Terraform — declarative foundation",
      body:
        "A single apply enables three APIs, derives the Compute Engine default service account from the project number, binds roles/dataproc.worker, creates a lifecycle-managed staging bucket and provisions the cluster. No console clicks, no drift.",
      chips: ["hashicorp/google 6.x", "idempotent", "remote-state ready"],
      code: "terraform apply -auto-approve",
    },
    gcp: {
      kicker: "Cloud guardrails",
      title: "Google Cloud — guardrails first",
      body:
        "Service Usage enables Dataproc, IAM and Compute. The default service account receives only roles/dataproc.worker, and a 30-second propagation buffer prevents race conditions on freshly created projects.",
      chips: ["3 APIs", "least privilege", "eventual consistency"],
      code: "roles/dataproc.worker",
    },
    dataproc: {
      kicker: "Managed compute",
      title: "Dataproc — managed Spark",
      body:
        "One master and two e2-standard-4 workers on Dataproc 2.2, with Stackdriver logging and an idle-delete policy that removes the cluster after two hours. The staging bucket is managed by Terraform, so destroy leaves no billable residue.",
      chips: ["2.2-debian12", "1 master · 2 workers", "TTL 7200s"],
      code: "gcloud dataproc clusters describe example-cluster --region=us-east1",
    },
    spark: {
      kicker: "Workload",
      title: "SparkPi — proof of life",
      body:
        "The Monte Carlo Pi example runs from the bundled spark-examples.jar with 1,000 tasks. Driver output and logs land in the Terraform-managed staging bucket — the same flow you can replay in the terminal below.",
      chips: ["Scala example", "1,000 tasks", "zero leftovers"],
      code: "gcloud dataproc jobs submit spark -- 1000",
    },
  };

  const archNodes = Array.from(document.querySelectorAll(".arch-node"));
  const archDetail = document.getElementById("arch-detail");

  function selectArchNode(key) {
    const data = architecture[key];
    if (!data || !archDetail) {
      return;
    }

    archNodes.forEach((node) => {
      const active = node.dataset.node === key;
      node.classList.toggle("is-active", active);
      node.setAttribute("aria-pressed", String(active));
    });

    archDetail.classList.remove("swap");
    void archDetail.offsetWidth;

    const chips = data.chips.map((chip) => `<span class="chip">${chip}</span>`).join("");

    archDetail.innerHTML = `
      <div class="arch-detail-head">
        <span class="arch-kicker">${data.kicker}</span>
        <h3>${data.title}</h3>
      </div>
      <p>${data.body}</p>
      <div class="chip-row">${chips}</div>
      <code class="arch-code">${data.code}</code>
    `;

    archDetail.classList.add("swap");
  }

  archNodes.forEach((node) => {
    node.addEventListener("click", () => selectArchNode(node.dataset.node));
  });

  /* ------------------------------------------------------------------------
     Terminal simulation
     ------------------------------------------------------------------------ */
  const terminal = document.getElementById("terminal");
  const output = document.getElementById("terminal-output");
  const startButton = document.getElementById("start-simulation");
  const startLabel = document.getElementById("start-label");
  const resetButton = document.getElementById("reset-simulation");
  const statusEl = document.getElementById("term-status");
  const timerEl = document.getElementById("term-timer");
  const progressBar = document.getElementById("term-progress-bar");
  const announcer = document.getElementById("sim-announcer");

  const terminalScript = [
    { kind: "comment", text: "# 1/3 · Infrastructure as Code" },
    { kind: "cmd", text: "terraform init" },
    { kind: "out", text: "Initializing the backend..." },
    { kind: "out", text: "Initializing provider plugins..." },
    { kind: "out", text: '- Installing hashicorp/google v6.50.0...' },
    { kind: "out", text: '- Installing hashicorp/time v0.14.2...' },
    { kind: "ok", text: "Terraform has been successfully initialized!" },
    { kind: "blank" },
    { kind: "cmd", text: "terraform apply -auto-approve" },
    { kind: "out", text: 'google_project_service.required["compute.googleapis.com"]: Creating...' },
    { kind: "out", text: 'google_project_service.required["dataproc.googleapis.com"]: Creating...' },
    { kind: "out", text: 'google_project_service.required["iam.googleapis.com"]: Creating...' },
    { kind: "out", text: "google_project_iam_member.dataproc_worker: Creating..." },
    { kind: "out", text: "google_storage_bucket.staging: Creating..." },
    { kind: "out", text: "google_dataproc_cluster.example: Still creating... [1m30s elapsed]" },
    { kind: "ok", text: "Apply complete! Resources: 6 added, 0 changed, 0 destroyed." },
    { kind: "blank" },
    { kind: "out", text: "Outputs:" },
    { kind: "out", text: 'cluster_name   = "example-cluster"' },
    { kind: "out", text: 'cluster_id     = "projects/demo-project/regions/us-east1/clusters/example-cluster"' },
    { kind: "out", text: 'staging_bucket = "demo-project-dataproc-staging-us-east1"' },
    { kind: "blank" },
    { kind: "comment", text: "# 2/3 · Managed Spark on Dataproc" },
    { kind: "cmd", text: "gcloud dataproc clusters describe example-cluster --region=us-east1" },
    { kind: "out", text: "clusterName: example-cluster" },
    { kind: "out", text: "status.state: RUNNING" },
    { kind: "out", text: "config.masterConfig.numInstances: 1" },
    { kind: "out", text: "config.workerConfig.numInstances: 2" },
    { kind: "blank" },
    { kind: "cmd", text: "gcloud dataproc jobs submit spark \\" },
    { kind: "cont", text: "  --cluster=example-cluster \\" },
    { kind: "cont", text: "  --region=us-east1 \\" },
    { kind: "cont", text: "  --class=org.apache.spark.examples.SparkPi \\" },
    { kind: "cont", text: "  --jars=file:///usr/lib/spark/examples/jars/spark-examples.jar \\" },
    { kind: "cont", text: "  -- 1000" },
    { kind: "ok", text: "Job [spark-pi-7f3c9a] submitted." },
    { kind: "out", text: "Waiting for job output..." },
    { kind: "out", text: "..." },
    { kind: "highlight", text: "Pi is roughly 3.141591" },
    { kind: "blank" },
    { kind: "comment", text: "# 3/3 · GKE-style workload inspection" },
    { kind: "cmd", text: "kubectl get pods -n spark-jobs" },
    { kind: "out", text: "NAME                              READY   STATUS    RESTARTS   AGE" },
    { kind: "out", text: "spark-pi-driver-6b9d7c8f5d-2xk4p  1/1     Running   0          9s" },
    { kind: "out", text: "spark-pi-exec-1                   1/1     Running   0          4s" },
    { kind: "out", text: "spark-pi-exec-2                   1/1     Running   0          4s" },
    { kind: "blank" },
    { kind: "cmd", text: "kubectl logs spark-pi-driver-6b9d7c8f5d-2xk4p -n spark-jobs --tail=3" },
    { kind: "out", text: "..." },
    { kind: "highlight", text: "Pi is roughly 3.141592" },
    { kind: "blank" },
    { kind: "comment", text: "# Cleanup · leave nothing billable behind" },
    { kind: "cmd", text: "terraform destroy -auto-approve" },
    { kind: "out", text: "google_dataproc_cluster.example: Destroying..." },
    { kind: "out", text: "google_storage_bucket.staging: Destroying..." },
    { kind: "ok", text: "Destroy complete! Resources: 6 destroyed." },
    { kind: "blank" },
    { kind: "ok", text: "Simulation complete · $0.00 billed · 0 resources leaked." },
  ];

  const delayByKind = {
    out: 70,
    ok: 120,
    highlight: 220,
    comment: 100,
    blank: 80,
  };

  let running = false;
  let runToken = 0;
  let timerHandle = null;
  let runStart = 0;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function scrollTerminal() {
    if (output) {
      output.scrollTop = output.scrollHeight;
    }
  }

  function setState(state, label) {
    if (terminal) {
      terminal.dataset.state = state;
      terminal.setAttribute("aria-busy", state === "running" ? "true" : "false");
    }
    if (statusEl) {
      statusEl.textContent = label;
    }
  }

  function updateProgress(index) {
    if (!progressBar) {
      return;
    }
    const percent = Math.min(100, Math.round((index / terminalScript.length) * 100));
    progressBar.style.width = `${percent}%`;
  }

  function appendLine(text, className = "term-out") {
    if (!output) {
      return null;
    }

    const line = document.createElement("div");
    line.className = `term-line ${className}`;
    line.textContent = text || "\u00a0";
    output.appendChild(line);
    scrollTerminal();
    return line;
  }

  function appendPromptLine() {
    if (!output) {
      return;
    }

    const line = document.createElement("div");
    line.className = "term-line term-cmd";

    const prompt = document.createElement("span");
    prompt.className = "term-prompt";
    prompt.textContent = "ongun@cloud:~$";

    const cursor = document.createElement("span");
    cursor.className = "term-cursor";
    cursor.setAttribute("aria-hidden", "true");

    line.append(prompt, cursor);
    output.appendChild(line);
    scrollTerminal();
  }

  function renderIdleTerminal() {
    if (!output) {
      return;
    }

    output.innerHTML = "";
    appendLine("# Ready when you are. Press “Run simulation”.", "term-comment");
    appendPromptLine();
    updateProgress(0);
  }

  async function typeCommand(text, token, withPrompt) {
    if (!output) {
      return;
    }

    const line = document.createElement("div");
    line.className = "term-line term-cmd";

    if (withPrompt) {
      const prompt = document.createElement("span");
      prompt.className = "term-prompt";
      prompt.textContent = "ongun@cloud:~$";
      line.appendChild(prompt);
    }

    const typed = document.createElement("span");
    const cursor = document.createElement("span");
    cursor.className = "term-cursor";
    cursor.setAttribute("aria-hidden", "true");

    line.append(typed, cursor);
    output.appendChild(line);
    scrollTerminal();

    if (reducedMotion) {
      typed.textContent = text;
      cursor.remove();
      scrollTerminal();
      return;
    }

    for (const character of text) {
      if (token !== runToken) {
        cursor.remove();
        return;
      }
      typed.textContent += character;
      scrollTerminal();
      await wait(13);
    }

    cursor.remove();
    await wait(180);
  }

  function startTimer() {
    runStart = Date.now();
    if (timerEl) {
      timerEl.textContent = "00:00";
    }

    timerHandle = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - runStart) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const seconds = String(elapsed % 60).padStart(2, "0");
      if (timerEl) {
        timerEl.textContent = `${minutes}:${seconds}`;
      }
    }, 250);
  }

  function stopTimer() {
    if (timerHandle !== null) {
      window.clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function finishSimulation() {
    running = false;
    stopTimer();
    setState("complete", "complete");

    if (progressBar) {
      progressBar.style.width = "100%";
    }
    if (startButton) {
      startButton.disabled = false;
      startButton.removeAttribute("aria-busy");
    }
    if (startLabel) {
      startLabel.textContent = "Run again";
    }
    if (announcer) {
      announcer.textContent =
        "Simulation complete. Six resources created and destroyed. Zero dollars billed.";
    }

    window.setTimeout(appendPromptLine, reducedMotion ? 0 : 450);
  }

  async function runSimulation() {
    if (running || !output) {
      return;
    }

    running = true;
    const token = ++runToken;

    output.innerHTML = "";
    updateProgress(0);
    setState("running", "running");
    startTimer();

    if (startButton) {
      startButton.disabled = true;
      startButton.setAttribute("aria-busy", "true");
    }
    if (startLabel) {
      startLabel.textContent = "Running...";
    }
    if (announcer) {
      announcer.textContent = "Simulation started.";
    }

    for (let index = 0; index < terminalScript.length; index += 1) {
      if (token !== runToken) {
        return;
      }

      const item = terminalScript[index];
      updateProgress(index + 1);

      if (item.kind === "cmd") {
        await typeCommand(item.text, token, true);
      } else if (item.kind === "cont") {
        await typeCommand(item.text, token, false);
      } else if (item.kind === "blank") {
        appendLine("", "term-out");
      } else if (item.kind === "ok") {
        appendLine(item.text, "term-ok");
      } else if (item.kind === "highlight") {
        appendLine(item.text, "term-highlight");
      } else if (item.kind === "comment") {
        appendLine(item.text, "term-comment");
      } else {
        appendLine(item.text, "term-out");
      }

      if (token !== runToken) {
        return;
      }

      if (item.kind !== "cmd" && item.kind !== "cont") {
        await wait(reducedMotion ? 0 : delayByKind[item.kind] || 70);
      }
    }

    finishSimulation();
  }

  function resetSimulation(announce = true) {
    runToken += 1;
    running = false;
    stopTimer();
    setState("idle", "idle");
    renderIdleTerminal();

    if (timerEl) {
      timerEl.textContent = "00:00";
    }
    if (startButton) {
      startButton.disabled = false;
      startButton.removeAttribute("aria-busy");
    }
    if (startLabel) {
      startLabel.textContent = "Run simulation";
    }
    if (announcer && announce) {
      announcer.textContent = "Simulation reset. Ready to run again.";
    }
  }

  if (startButton) {
    startButton.addEventListener("click", () => {
      if (!running) {
        runSimulation();
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => resetSimulation());
  }

  document.querySelectorAll("[data-start-simulation]").forEach((button) => {
    button.addEventListener("click", () => {
      const simulationSection = document.getElementById("simulation");
      if (simulationSection) {
        simulationSection.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }

      window.setTimeout(() => {
        if (!running) {
          runSimulation();
        }
      }, reducedMotion ? 0 : 600);
    });
  });

  /* Deep link: /#simulate scrolls to the terminal and starts the run. */
  const autoplay = window.location.hash === "#simulate";
  if (autoplay) {
    const launch = () => {
      const simulationSection = document.getElementById("simulation");
      if (simulationSection) {
        simulationSection.scrollIntoView({ behavior: "auto", block: "start" });
      }
      window.setTimeout(runSimulation, 500);
    };

    if (document.readyState === "complete") {
      launch();
    } else {
      window.addEventListener("load", launch, { once: true });
    }
  }
})();
