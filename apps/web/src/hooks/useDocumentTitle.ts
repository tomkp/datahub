import { useEffect, useRef } from 'react';

const APP_NAME = 'DataHub';

export function useDocumentTitle(title?: string) {
  const previousTitle = useRef(document.title);

  useEffect(() => {
    const originalTitle = previousTitle.current;
    const newTitle = title ? `${title} - ${APP_NAME}` : APP_NAME;
    document.title = newTitle;

    return () => {
      document.title = originalTitle;
    };
  }, [title]);
}
