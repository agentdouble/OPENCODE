import { TextAttributes } from "@opentui/core"
import { For, createSignal, onCleanup, onMount } from "solid-js"
import { useKV } from "../context/kv"

// Ombre faible
const LOGO_MIA_OMBRE_FAIBLE = [
  "██░    ███░  ██░   █████░  ",
  "███░  ████░  ██░  ██   ██░ ",
  "██ ████ ██░  ██░  ███████░ ",
  "██  ██  ██░  ██░  ██   ██░ ",
  "██      ██░  ██░  ██   ██░ ",
]

// Ombre forte
const LOGO_MIA_OMBRE_FORTE = [
  "██▒    ███▒  ██▒   █████▒  ",
  "███▒  ████▒  ██▒  ██   ██▒ ",
  "██ ████ ██▒  ██▒  ███████▒ ",
  "██  ██  ██▒  ██▒  ██   ██▒ ",
  "██      ██▒  ██▒  ██   ██▒ ",
]

const LOGO_MIA_COMPACT = [
  "██▒    ███▒  ██▒   █████▒  ",
  "██ ████ ██▒  ██▒  ███████▒ ",
  "██      ██▒  ██▒  ██   ██▒ ",
]

const PIXEL_LOGO_POSES = {
  idle: [
    "   C  C   ",
    "  AAAAAA  ",
    " AA AA AA ",
    "  AAAAAA  ",
  ],
  earsIn: [
    "    CC    ",
    "  AAAAAA  ",
    " AA AA AA ",
    "  AAAAAA  ",
  ],
  blink: [
    "   C  C   ",
    "  AAAAAA  ",
    " AAAAAAAA ",
    "  AAAAAA  ",
  ],
  lookLeft: [
    "  C  C    ",
    " AAAAAA   ",
    "AA AA AA  ",
    " AAAAAA   ",
  ],
  lookRight: [
    "    C  C  ",
    "   AAAAAA ",
    "  AA AA AA",
    "   AAAAAA ",
  ],
  squish: [
    "   C  C   ",
    " AAAAAAAA ",
    " AA AA AA ",
    " AAAAAAAA ",
  ],
  perk: [
    "  C    C  ",
    "   AAAA   ",
    " AA AA AA ",
    "  AAAAAA  ",
  ],
  duck: [
    "          ",
    "   C  C   ",
    "  AAAAAA  ",
    " AA AA AA ",
  ],
  winkLeft: [
    "   C  C   ",
    "  AAAAAA  ",
    " AAAAA AA ",
    "  AAAAAA  ",
  ],
  winkRight: [
    "   C  C   ",
    "  AAAAAA  ",
    " AA AAAAA ",
    "  AAAAAA  ",
  ],
  stretch: [
    "  C    C  ",
    " AAAAAAAA ",
    " AA AA AA ",
    " AAAAAAAA ",
  ],
  tuckLeft: [
    "   C  C   ",
    "   AAAAA  ",
    "  A AA AA ",
    "   AAAAA  ",
  ],
  tuckRight: [
    "   C  C   ",
    "  AAAAA   ",
    " AA AA A  ",
    "  AAAAA   ",
  ],
} as const

type MascotPose = keyof typeof PIXEL_LOGO_POSES
type AnimationStep = { pose: MascotPose; delay: number }
type AnimationFamily =
  | "blink"
  | "doubleBlink"
  | "earWiggle"
  | "glance"
  | "scan"
  | "curious"
  | "wink"
  | "peek"
  | "shimmy"
  | "stretch"
  | "bounce"
  | "rest"
type BrandPhase = "steady" | "soft" | "pulse" | "line0" | "line1" | "line2"
type BrandStep = { phase: BrandPhase; delay: number }
type BrandFamily = "sweep" | "pulse" | "flicker" | "breathe" | "rest"

const PIXEL_LOGO_COLORS: Record<string, string> = {
  A: "#86ADD0",
  B: "#6C97BF",
  C: "#9FC3E3",
}

function randomBetween(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

export function Logo() {
  const kv = useKV()
  const blue = "#007bff"
  const blueSoft = "#0066d9"
  const blueGlow = "#3d98ff"
  const blueSpark = "#73b6ff"
  const [pose, setPose] = createSignal<MascotPose>("idle")
  const [brandPhase, setBrandPhase] = createSignal<BrandPhase>("steady")

  // Choisis ici le logo à afficher :
  // const selected = LOGO_MIA_OMBRE_FAIBLE
  const selected = LOGO_MIA_COMPACT

  onMount(() => {
    if (!kv.get("animations_enabled", true)) return
    let mascotTimeout: ReturnType<typeof setTimeout> | undefined
    let brandTimeout: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    let lastFamily: AnimationFamily | undefined
    let lastBrandFamily: BrandFamily | undefined

    const animationWeights: { name: AnimationFamily; weight: number }[] = [
      { name: "blink", weight: 14 },
      { name: "doubleBlink", weight: 10 },
      { name: "earWiggle", weight: 14 },
      { name: "glance", weight: 13 },
      { name: "scan", weight: 11 },
      { name: "curious", weight: 11 },
      { name: "wink", weight: 10 },
      { name: "peek", weight: 8 },
      { name: "shimmy", weight: 7 },
      { name: "stretch", weight: 6 },
      { name: "bounce", weight: 8 },
      { name: "rest", weight: 8 },
    ]

    const brandWeights: { name: BrandFamily; weight: number }[] = [
      { name: "sweep", weight: 16 },
      { name: "pulse", weight: 12 },
      { name: "flicker", weight: 10 },
      { name: "breathe", weight: 12 },
      { name: "rest", weight: 8 },
    ]

    function createBlink(): AnimationStep[] {
      return [
        { pose: "blink", delay: randomBetween(70, 120) },
        { pose: "idle", delay: randomBetween(900, 2200) },
      ]
    }

    function createDoubleBlink(): AnimationStep[] {
      return [
        { pose: "blink", delay: randomBetween(60, 100) },
        { pose: "idle", delay: randomBetween(70, 130) },
        { pose: "blink", delay: randomBetween(80, 130) },
        { pose: "idle", delay: randomBetween(1300, 2400) },
      ]
    }

    function createEarWiggle(): AnimationStep[] {
      return [
        { pose: Math.random() > 0.5 ? "perk" : "earsIn", delay: randomBetween(90, 150) },
        { pose: "idle", delay: randomBetween(70, 130) },
        { pose: "earsIn", delay: randomBetween(100, 170) },
        { pose: "idle", delay: randomBetween(1000, 2000) },
      ]
    }

    function createGlance(): AnimationStep[] {
      const first = Math.random() > 0.5 ? "lookLeft" : "lookRight"
      const second = first === "lookLeft" ? "lookRight" : "lookLeft"

      if (Math.random() > 0.45) {
        return [
          { pose: first, delay: randomBetween(130, 200) },
          { pose: "idle", delay: randomBetween(1000, 1900) },
        ]
      }

      return [
        { pose: first, delay: randomBetween(130, 200) },
        { pose: "idle", delay: randomBetween(70, 120) },
        { pose: second, delay: randomBetween(140, 220) },
        { pose: "idle", delay: randomBetween(1100, 2100) },
      ]
    }

    function createScan(): AnimationStep[] {
      const first = Math.random() > 0.5 ? "lookLeft" : "lookRight"
      const second = first === "lookLeft" ? "lookRight" : "lookLeft"

      return [
        { pose: first, delay: randomBetween(140, 220) },
        { pose: "idle", delay: randomBetween(60, 110) },
        { pose: second, delay: randomBetween(140, 220) },
        { pose: "idle", delay: randomBetween(60, 110) },
        { pose: first, delay: randomBetween(100, 170) },
        { pose: "idle", delay: randomBetween(1300, 2200) },
      ]
    }

    function createCurious(): AnimationStep[] {
      const look = Math.random() > 0.5 ? "lookLeft" : "lookRight"

      return [
        { pose: "perk", delay: randomBetween(100, 170) },
        { pose: look, delay: randomBetween(130, 220) },
        { pose: "blink", delay: randomBetween(70, 110) },
        { pose: "idle", delay: randomBetween(1400, 2400) },
      ]
    }

    function createWink(): AnimationStep[] {
      const wink = Math.random() > 0.5 ? "winkLeft" : "winkRight"
      const recovery = wink === "winkLeft" ? "lookLeft" : "lookRight"

      return [
        { pose: wink, delay: randomBetween(90, 140) },
        { pose: recovery, delay: randomBetween(100, 170) },
        { pose: "idle", delay: randomBetween(1100, 2100) },
      ]
    }

    function createPeek(): AnimationStep[] {
      const peek = Math.random() > 0.5 ? "tuckLeft" : "tuckRight"
      const glance = peek === "tuckLeft" ? "lookLeft" : "lookRight"

      return [
        { pose: "duck", delay: randomBetween(80, 130) },
        { pose: peek, delay: randomBetween(120, 180) },
        { pose: glance, delay: randomBetween(110, 170) },
        { pose: "idle", delay: randomBetween(1300, 2200) },
      ]
    }

    function createShimmy(): AnimationStep[] {
      const first = Math.random() > 0.5 ? "lookLeft" : "lookRight"
      const second = first === "lookLeft" ? "lookRight" : "lookLeft"

      return [
        { pose: first, delay: randomBetween(90, 140) },
        { pose: "perk", delay: randomBetween(80, 120) },
        { pose: second, delay: randomBetween(90, 140) },
        { pose: "squish", delay: randomBetween(100, 140) },
        { pose: "idle", delay: randomBetween(1200, 2100) },
      ]
    }

    function createStretch(): AnimationStep[] {
      return [
        { pose: "stretch", delay: randomBetween(110, 180) },
        { pose: "perk", delay: randomBetween(90, 130) },
        { pose: "idle", delay: randomBetween(1300, 2200) },
      ]
    }

    function createBounce(): AnimationStep[] {
      const steps: AnimationStep[] = [
        { pose: "perk", delay: randomBetween(80, 140) },
        { pose: "squish", delay: randomBetween(100, 150) },
        { pose: "idle", delay: randomBetween(80, 130) },
      ]

      if (Math.random() > 0.5) {
        steps.push(
          { pose: "duck", delay: randomBetween(90, 140) },
          { pose: "squish", delay: randomBetween(90, 140) },
          { pose: "idle", delay: randomBetween(1200, 2200) },
        )
        return steps
      }

      steps.push({ pose: "idle", delay: randomBetween(1200, 2200) })
      return steps
    }

    function createRest(): AnimationStep[] {
      return [{ pose: "idle", delay: randomBetween(2200, 4200) }]
    }

    function createBrandSweep(): BrandStep[] {
      const order: BrandPhase[] =
        Math.random() > 0.5 ? ["line0", "line1", "line2"] : ["line2", "line1", "line0"]

      return [
        { phase: order[0], delay: randomBetween(90, 140) },
        { phase: order[1], delay: randomBetween(80, 130) },
        { phase: order[2], delay: randomBetween(100, 150) },
        { phase: "steady", delay: randomBetween(1400, 2600) },
      ]
    }

    function createBrandPulse(): BrandStep[] {
      return [
        { phase: "pulse", delay: randomBetween(110, 180) },
        { phase: "soft", delay: randomBetween(90, 140) },
        { phase: "pulse", delay: randomBetween(100, 160) },
        { phase: "steady", delay: randomBetween(1700, 2800) },
      ]
    }

    function createBrandFlicker(): BrandStep[] {
      const focus = randomBetween(0, selected.length - 1) as 0 | 1 | 2

      return [
        { phase: `line${focus}` as BrandPhase, delay: randomBetween(70, 110) },
        { phase: "soft", delay: randomBetween(70, 110) },
        { phase: `line${(focus + 1) % selected.length}` as BrandPhase, delay: randomBetween(70, 120) },
        { phase: "steady", delay: randomBetween(1500, 2600) },
      ]
    }

    function createBrandBreathe(): BrandStep[] {
      return [
        { phase: "soft", delay: randomBetween(220, 320) },
        { phase: "pulse", delay: randomBetween(180, 260) },
        { phase: "soft", delay: randomBetween(160, 240) },
        { phase: "steady", delay: randomBetween(1800, 3000) },
      ]
    }

    function createBrandRest(): BrandStep[] {
      return [{ phase: "steady", delay: randomBetween(2200, 4200) }]
    }

    function nextFamily() {
      const pool = animationWeights.filter((entry) => entry.name !== lastFamily)
      const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
      let roll = Math.random() * total

      for (const entry of pool) {
        roll -= entry.weight
        if (roll <= 0) return entry.name
      }

      return pool[pool.length - 1]?.name ?? "blink"
    }

    function nextBrandFamily() {
      const pool = brandWeights.filter((entry) => entry.name !== lastBrandFamily)
      const total = pool.reduce((sum, entry) => sum + entry.weight, 0)
      let roll = Math.random() * total

      for (const entry of pool) {
        roll -= entry.weight
        if (roll <= 0) return entry.name
      }

      return pool[pool.length - 1]?.name ?? "sweep"
    }

    function buildSequence(family: AnimationFamily): AnimationStep[] {
      switch (family) {
        case "blink":
          return createBlink()
        case "doubleBlink":
          return createDoubleBlink()
        case "earWiggle":
          return createEarWiggle()
        case "glance":
          return createGlance()
        case "scan":
          return createScan()
        case "curious":
          return createCurious()
        case "wink":
          return createWink()
        case "peek":
          return createPeek()
        case "shimmy":
          return createShimmy()
        case "stretch":
          return createStretch()
        case "bounce":
          return createBounce()
        case "rest":
          return createRest()
      }
    }

    function buildBrandSequence(family: BrandFamily): BrandStep[] {
      switch (family) {
        case "sweep":
          return createBrandSweep()
        case "pulse":
          return createBrandPulse()
        case "flicker":
          return createBrandFlicker()
        case "breathe":
          return createBrandBreathe()
        case "rest":
          return createBrandRest()
      }
    }

    function run(steps: AnimationStep[], index = 0) {
      if (stopped) return
      const step = steps[index]
      setPose(step.pose)
      mascotTimeout = setTimeout(() => {
        if (index < steps.length - 1) {
          run(steps, index + 1)
          return
        }

        const family = nextFamily()
        lastFamily = family
        run(buildSequence(family))
      }, step.delay)
    }

    function runBrand(steps: BrandStep[], index = 0) {
      if (stopped) return
      const step = steps[index]
      setBrandPhase(step.phase)
      brandTimeout = setTimeout(() => {
        if (index < steps.length - 1) {
          runBrand(steps, index + 1)
          return
        }

        const family = nextBrandFamily()
        lastBrandFamily = family
        runBrand(buildBrandSequence(family))
      }, step.delay)
    }

    mascotTimeout = setTimeout(() => {
      run([{ pose: "idle", delay: randomBetween(700, 1800) }])
    }, 600)
    brandTimeout = setTimeout(() => {
      runBrand([{ phase: "steady", delay: randomBetween(400, 1300) }])
    }, 900)

    onCleanup(() => {
      stopped = true
      if (mascotTimeout) clearTimeout(mascotTimeout)
      if (brandTimeout) clearTimeout(brandTimeout)
    })
  })

  function lineColor(index: number) {
    const phase = brandPhase()
    if (phase === "pulse") return blueGlow
    if (phase === "soft") return blueSoft
    if (phase === "line0") return index === 0 ? blueSpark : blueSoft
    if (phase === "line1") return index === 1 ? blueSpark : blueSoft
    if (phase === "line2") return index === 2 ? blueSpark : blueSoft
    return blue
  }

  return (
    <box flexDirection="column" width="100%" alignItems="center">
      <box flexDirection="column" alignItems="center" paddingBottom={1}>
        <For each={PIXEL_LOGO_POSES[pose()]}>
          {(line) => (
            <text wrapMode="none">
              <For each={line.split("")}>
                {(pixel) => {
                  const bg = PIXEL_LOGO_COLORS[pixel]
                  if (!bg) return " "
                  return <span style={{ bg }}> </span>
                }}
              </For>
            </text>
          )}
        </For>
      </box>

      {/* Logo centré */}
      <box flexDirection="column" alignItems="center">
        <For each={selected}>
          {(line, index) => (
            <text fg={lineColor(index())} attributes={TextAttributes.BOLD}>
              {line}
            </text>
          )}
        </For>
      </box>
    </box>
  )
}
