
const categories = [
    { name: "Shirts", label: "01", angle: -90 },
    { name: "Dresses", label: "02", angle: -30 },
    { name: "Shoes", label: "03", angle: 30 },
    { name: "Jeans", label: "04", angle: 90 },
    { name: "Jackets", label: "05", angle: 150 },
    { name: "T-Shirts", label: "06", angle: 210 }
];

function HomeOrbit({ onSelectCategory }) {
    return (
        <div className="home-orbit">
            <div className="orbit-ring orbit-ring-outer" />
            <div className="orbit-ring orbit-ring-inner" />

            <div className="orbit-center">
                <span className="orbit-center-star">✳</span>
                <span>REWEAR</span>
                <small>FASHION, AGAIN.</small>
            </div>

            {categories.map((category) => {
                const radians = (category.angle * Math.PI) / 180;
                const radius = 172;

                const x = Math.cos(radians) * radius;
                const y = Math.sin(radians) * radius;

                
            })}
        </div>
    );
}

export default HomeOrbit;
