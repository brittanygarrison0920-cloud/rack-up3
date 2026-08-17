import Closet from './pages/Closet';
import AddItem from './pages/AddItem';
import Outfits from './pages/Outfits';
import Loans from './pages/Loans';
import Stylist from './pages/Stylist';
import QRScanner from './pages/QRScanner';
import Profile from './pages/Profile';
import Insights from './pages/Insights';
import Lookbook from './pages/Lookbook';
import __Layout from './Layout';


export const PAGES = {
    "Closet": Closet,
    "AddItem": AddItem,
    "Outfits": Outfits,
    "Loans": Loans,
    "Stylist": Stylist,
    "QRScanner": QRScanner,
    "Profile": Profile,
    "Insights": Insights,
    "Lookbook": Lookbook,
}

export const pagesConfig = {
    mainPage: "Closet",
    Pages: PAGES,
    Layout: __Layout,
};