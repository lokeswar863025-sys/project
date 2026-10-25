import React from 'react';
import { motion } from 'framer-motion';

export default function SlideIn({ children, direction = 'left', delay = 0, duration = 0.6, className = '' }) {
  const xOffset = direction === 'left' ? -40 : 40;

  return (
    <motion.div
      initial={{ opacity: 0, x: xOffset }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
