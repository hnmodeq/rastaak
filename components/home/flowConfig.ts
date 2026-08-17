/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  RASTAAK FLOW STEPS CONTROLLER CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Edit this file to have FULL CONTROL over the English titles, captions,
 * and scroll activation timing for the process steps on the homepage.
 */

export interface FlowStepConfig {
  /** Step number label ('01', '02', '03', '04') */
  num: string;

  /** Main Step Title (e.g. 'Activation, simplified') */
  title: string;

  /** Subtitle / Key statement */
  subtitle: string;

  /** Full Caption / Paragraph description */
  caption: string;

  /**
   * Scroll timing range [startProgress, endProgress] between 0.0 and 1.0.
   *  - 0.0 = start of the flow section
   *  - 1.0 = end of the flow section
   *
   * Tweak these values to change how long each step stays active as you scroll!
   */
  progressRange: [number, number];
}

export const FLOW_CONFIG: FlowStepConfig[] = [
  {
    num: '01',
    title: 'Activation, simplified',
    subtitle: 'One call triggers mobilization.',
    caption:
      'Your requirements: craft, count, and start date route directly to our verified crews. No hand-offs. No escalations. Just boots on the ground in minutes.',
    progressRange: [0.0, 0.22],
  },
  {
    num: '02',
    title: 'Cleared to count',
    subtitle: 'Our team handles all screening and verification before dispatch.',
    caption:
      'Compliance, background, certifications, and fitness-for-duty — we enforce a zero-fail model to guarantee every worker clears the gate on Day 1.',
    progressRange: [0.22, 0.55],
  },
  {
    num: '03',
    title: 'Proven field match',
    subtitle: "We don't just provide available workers. We deploy proven crews.",
    caption:
      'By filtering for past performance, role fit, and reliability, we deliver teams engineered for endurance — ensuring your project stays fully manned from first break to completion.',
    progressRange: [0.55, 0.82],
  },
  {
    num: '04',
    title: 'Seamless arrival',
    subtitle: 'We manage the "last mile" of mobilization.',
    caption:
      'Every crew arrives site-ready with finalized reporting details. With real-time arrival monitoring and active coordination, we ensure your shift starts on time, even when field conditions shift.',
    progressRange: [0.82, 1.0],
  },
];
