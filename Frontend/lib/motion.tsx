'use client'

/**
 * Motion wrapper with fallback support
 * This file provides motion components with graceful fallback if framer-motion fails
 */

import React from 'react'

// Try to import framer-motion, fallback to div if it fails
let motion: any
let AnimatePresence: any

try {
  const framerMotion = require('framer-motion')
  motion = framerMotion.motion
  AnimatePresence = framerMotion.AnimatePresence
} catch (error) {
  // Fallback motion components (renders as regular divs with CSS transitions)
  const createMotionComponent = (tag: string) => {
    return React.forwardRef<HTMLElement, any>((props, ref) => {
      const {
        initial,
        animate,
        exit,
        transition,
        whileHover,
        whileTap,
        variants,
        custom,
        onAnimationComplete,
        layoutId,
        layout,
        children,
        className,
        style,
        ...restProps
      } = props

      // Apply basic CSS transition for fallback
      const fallbackStyle = {
        ...style,
        transition: 'all 0.3s ease-in-out',
      }

      return React.createElement(
        tag,
        {
          ref,
          className,
          style: fallbackStyle,
          ...restProps,
        },
        children
      )
    })
  }

  motion = {
    div: createMotionComponent('div'),
    section: createMotionComponent('section'),
    article: createMotionComponent('article'),
    main: createMotionComponent('main'),
    header: createMotionComponent('header'),
    footer: createMotionComponent('footer'),
    nav: createMotionComponent('nav'),
    aside: createMotionComponent('aside'),
    h1: createMotionComponent('h1'),
    h2: createMotionComponent('h2'),
    h3: createMotionComponent('h3'),
    h4: createMotionComponent('h4'),
    h5: createMotionComponent('h5'),
    h6: createMotionComponent('h6'),
    p: createMotionComponent('p'),
    span: createMotionComponent('span'),
    a: createMotionComponent('a'),
    button: createMotionComponent('button'),
    input: createMotionComponent('input'),
    textarea: createMotionComponent('textarea'),
    select: createMotionComponent('select'),
    label: createMotionComponent('label'),
    form: createMotionComponent('form'),
    ul: createMotionComponent('ul'),
    ol: createMotionComponent('ol'),
    li: createMotionComponent('li'),
    img: createMotionComponent('img'),
    svg: createMotionComponent('svg'),
    path: createMotionComponent('path'),
  }

  // Fallback AnimatePresence (just renders children)
  AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>
}

export { motion, AnimatePresence }

// Export common animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 },
}

export const slideInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
  transition: { duration: 0.3 },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.3 },
}

// Container animation for stagger children
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Item animation for stagger children
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}
