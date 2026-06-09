import { useEffect } from 'react';

export function GoogleTradutor() {
  useEffect(() => {
    // 1. Cria a função global que o script da Google vai procurar
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'pt', // Idioma original do seu site
          includedLanguages: 'en,es,pt', // Línguas que você quer liberar (Inglês, Espanhol, PT)
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element' // ID da div onde o botão vai renderizar
      );
    };

    // 2. Injeta o script da Google dinamicamente na página
    const idScript = 'google-translate-script';
    if (!document.getElementById(idScript)) {
      const addScript = document.createElement('script');
      addScript.id = idScript;
      addScript.setAttribute(
        'src',
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      );
      document.body.appendChild(addScript);
    }
  }, []);

  return (
    // Esse é o container onde o seletor de línguas da Google vai aparecer
    <div id="google_translate_element" className="lm-google-translate" />
  );
}