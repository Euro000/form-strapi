/* ------------------------------------------------------------------ */
/*  Thumbnail ➜ full-size preview (click-to-open or hover-to-open)     */
/* ------------------------------------------------------------------ */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';

/**
 *  Pass `mode="click"` for click-to-open  (default)          – stops row nav
 *       `mode="hover"` for hover-preview – shows while hover
 */
const PreviewImageCell = ({
  cell,
  mode = 'click',             // 'click' | 'hover'
}: {
  cell: any;
  mode?: 'click' | 'hover';
}) => {
  const file = cell?.value?.[0];
  const [open, setOpen] = useState(false);

  if (!file) return null;

  const thumb = file.formats?.thumbnail?.url || file.url;
  const full  = file.url;

  /* ---------------------------------------------------------------- */
  /* tiny helper → full-size overlay rendered into <body>             */
  /* ---------------------------------------------------------------- */
  const FullSize = () =>
    ReactDOM.createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}
        onClick={() => setOpen(false)}
      >
        <img
          src={full}
          alt={file.alternativeText || file.name}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            borderRadius: 4,
          }}
        />
      </div>,
      document.body
    );

  /* ---------------------------------------------------------------- */
  /* click vs. hover modes                                            */
  /* ---------------------------------------------------------------- */
  const events =
    mode === 'hover'
      ? {
          onMouseEnter: () => setOpen(true),
          onMouseLeave: () => setOpen(false),
        }
      : {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();      // ← prevents row navigation
            setOpen(true);
          },
        };

  return (
    <>
      <img
        src={thumb}
        alt={file.alternativeText || file.name}
        style={{
          width: 36,
          height: 36,
          objectFit: 'cover',
          borderRadius: 4,
          cursor: 'pointer',
        }}
        {...events}
      />

      {open && <FullSize />}
    </>
  );
};