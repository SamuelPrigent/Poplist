import { themes } from "@/lib/themes";

// Blocking script that runs before first paint to prevent theme flash.
// Reads the theme from localStorage (Zustand persist format) and applies
// CSS variables on <html> synchronously.
const themeScript = `(function(){try{var s=localStorage.getItem("theme-storage");if(s){var d=JSON.parse(s);var t=d&&d.state&&d.state.theme;if(t&&t!=="ocean"){var v=${JSON.stringify(themes.midnight)};var r=document.documentElement;for(var k in v){r.style.setProperty(k,v[k])}r.setAttribute("data-theme",t)}}}catch(e){}})()`;

export function ThemeScript() {
	return (
		<script
			dangerouslySetInnerHTML={{ __html: themeScript }}
		/>
	);
}
